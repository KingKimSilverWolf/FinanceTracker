import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from './config';

export interface GroupMember {
  userId: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: 'admin' | 'member';
  joinedAt: Date;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  members: GroupMember[];
  createdAt: Date;
  updatedAt: Date;
}

// Internal Firestore member type
interface FirestoreMember {
  userId: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: 'admin' | 'member';
  joinedAt: { toDate: () => Date } | Date;
}

/**
 * Create a new group
 */
export async function createGroup(
  name: string,
  description: string,
  createdBy: string,
  creatorEmail: string,
  creatorDisplayName: string,
  creatorPhotoURL: string | null
): Promise<string> {
  const groupRef = await addDoc(collection(db, 'groups'), {
    name,
    description,
    createdBy,
    members: [
      {
        userId: createdBy,
        email: creatorEmail,
        displayName: creatorDisplayName,
        photoURL: creatorPhotoURL,
        role: 'admin',
        joinedAt: serverTimestamp(),
      },
    ],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return groupRef.id;
}

/**
 * Get a single group by ID
 */
export async function getGroup(groupId: string): Promise<Group | null> {
  const groupRef = doc(db, 'groups', groupId);
  const groupSnap = await getDoc(groupRef);

  if (!groupSnap.exists()) {
    return null;
  }

  const data = groupSnap.data();
  return {
    id: groupSnap.id,
    name: data.name,
    description: data.description,
    createdBy: data.createdBy,
    members: data.members.map((m: FirestoreMember) => ({
      ...m,
      joinedAt: m.joinedAt instanceof Date ? m.joinedAt : m.joinedAt?.toDate?.() || new Date(),
    })),
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
}

/**
 * Get all groups for a user
 */
export async function getUserGroups(userId: string): Promise<Group[]> {
  // Note: Firestore array-contains doesn't work with partial objects
  // We query all groups and filter client-side
  // In production, consider using a separate collection for user-group relationships
  const allGroupsSnap = await getDocs(collection(db, 'groups'));
  const groups: Group[] = [];

  allGroupsSnap.forEach((doc) => {
    const data = doc.data();
    const isMember = data.members.some((m: FirestoreMember) => m.userId === userId);

    if (isMember) {
      groups.push({
        id: doc.id,
        name: data.name,
        description: data.description,
        createdBy: data.createdBy,
        members: data.members.map((m: FirestoreMember) => ({
          ...m,
          joinedAt: m.joinedAt instanceof Date ? m.joinedAt : m.joinedAt?.toDate?.() || new Date(),
        })),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      });
    }
  });

  // Sort by updatedAt descending
  groups.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  return groups;
}

/**
 * Add a member to a group
 */
export async function addGroupMember(
  groupId: string,
  userId: string,
  email: string,
  displayName: string,
  photoURL: string | null,
  role: 'admin' | 'member' = 'member'
): Promise<void> {
  const groupRef = doc(db, 'groups', groupId);

  await updateDoc(groupRef, {
    members: arrayUnion({
      userId,
      email,
      displayName,
      photoURL,
      role,
      joinedAt: serverTimestamp(),
    }),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Remove a member from a group
 */
export async function removeGroupMember(groupId: string, userId: string): Promise<void> {
  const group = await getGroup(groupId);
  if (!group) {
    throw new Error('Group not found');
  }

  const memberToRemove = group.members.find((m) => m.userId === userId);
  if (!memberToRemove) {
    throw new Error('Member not found in group');
  }

  const groupRef = doc(db, 'groups', groupId);

  await updateDoc(groupRef, {
    members: arrayRemove(memberToRemove),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Update group details
 */
export async function updateGroup(
  groupId: string,
  updates: { name?: string; description?: string }
): Promise<void> {
  const groupRef = doc(db, 'groups', groupId);

  await updateDoc(groupRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a group
 */
export async function deleteGroup(groupId: string): Promise<void> {
  const groupRef = doc(db, 'groups', groupId);
  await deleteDoc(groupRef);
}

/**
 * Check if user is admin of a group
 */
export function isGroupAdmin(group: Group, userId: string): boolean {
  const member = group.members.find((m) => m.userId === userId);
  return member?.role === 'admin' || false;
}
