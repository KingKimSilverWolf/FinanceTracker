import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  Timestamp,
  onSnapshot,
  type Unsubscribe,
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
  cardDesign: string; // Card design theme ID
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupInvitation {
  id: string;
  groupId: string;
  groupName: string;
  inviteCode: string;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  expiresAt: Date;
  usageLimit: number | null; // null = unlimited
  usedCount: number;
  isActive: boolean;
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
  creatorPhotoURL: string | null,
  cardDesign: string = 'sunset'
): Promise<string> {
  const now = new Date();
  const groupRef = await addDoc(collection(db, 'groups'), {
    name,
    description,
    createdBy,
    cardDesign,
    members: [
      {
        userId: createdBy,
        email: creatorEmail,
        displayName: creatorDisplayName,
        photoURL: creatorPhotoURL,
        role: 'admin',
        joinedAt: now,
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
    cardDesign: data.cardDesign || 'sunset',
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
        cardDesign: data.cardDesign || 'sunset',
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
      joinedAt: new Date(),
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
  updates: { name?: string; description?: string; cardDesign?: string }
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

/**
 * Generate a random invite code
 */
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Create a group invitation
 */
export async function createGroupInvitation(
  groupId: string,
  groupName: string,
  createdBy: string,
  createdByName: string,
  expiresInDays: number = 7,
  usageLimit: number | null = null
): Promise<GroupInvitation> {
  const inviteCode = generateInviteCode();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000);

  const invitationData = {
    groupId,
    groupName,
    inviteCode,
    createdBy,
    createdByName,
    createdAt: serverTimestamp(),
    expiresAt: Timestamp.fromDate(expiresAt),
    usageLimit,
    usedCount: 0,
    isActive: true,
  };

  const docRef = await addDoc(collection(db, 'groupInvitations'), invitationData);

  return {
    id: docRef.id,
    ...invitationData,
    createdAt: now,
    expiresAt,
  };
}

/**
 * Get a group invitation by code
 */
export async function getGroupInvitation(inviteCode: string): Promise<GroupInvitation | null> {
  const q = query(
    collection(db, 'groupInvitations'),
    where('inviteCode', '==', inviteCode),
    where('isActive', '==', true)
  );

  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null;
  }

  const doc = querySnapshot.docs[0];
  const data = doc.data();

  return {
    id: doc.id,
    groupId: data.groupId,
    groupName: data.groupName,
    inviteCode: data.inviteCode,
    createdBy: data.createdBy,
    createdByName: data.createdByName,
    createdAt: data.createdAt?.toDate() || new Date(),
    expiresAt: data.expiresAt?.toDate() || new Date(),
    usageLimit: data.usageLimit,
    usedCount: data.usedCount || 0,
    isActive: data.isActive,
  };
}

/**
 * Accept a group invitation and add user to group
 */
export async function acceptGroupInvitation(
  inviteCode: string,
  userId: string,
  userEmail: string,
  displayName: string,
  photoURL: string | null
): Promise<{ success: boolean; error?: string; groupId?: string }> {
  try {
    // Get the invitation
    const invitation = await getGroupInvitation(inviteCode);

    if (!invitation) {
      return { success: false, error: 'Invalid or expired invitation code' };
    }

    // Check if invitation is still valid
    const now = new Date();
    if (now > invitation.expiresAt) {
      return { success: false, error: 'This invitation has expired' };
    }

    // Check usage limit
    if (invitation.usageLimit !== null && invitation.usedCount >= invitation.usageLimit) {
      return { success: false, error: 'This invitation has reached its usage limit' };
    }

    // Get the group
    const group = await getGroup(invitation.groupId);
    if (!group) {
      return { success: false, error: 'Group not found' };
    }

    // Check if user is already a member
    const isAlreadyMember = group.members.some((m) => m.userId === userId);
    if (isAlreadyMember) {
      return { success: false, error: 'You are already a member of this group' };
    }

    // Add user to group
    await addGroupMember(invitation.groupId, userId, userEmail, displayName, photoURL);

    // Update invitation usage count
    const invitationRef = doc(db, 'groupInvitations', invitation.id);
    await updateDoc(invitationRef, {
      usedCount: invitation.usedCount + 1,
    });

    return { success: true, groupId: invitation.groupId };
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return { success: false, error: 'Failed to join group. Please try again.' };
  }
}

/**
 * Deactivate a group invitation
 */
export async function deactivateGroupInvitation(invitationId: string): Promise<void> {
  const invitationRef = doc(db, 'groupInvitations', invitationId);
  await updateDoc(invitationRef, {
    isActive: false,
  });
}

/**
 * Get all active invitations for a group
 */
export async function getGroupInvitations(groupId: string): Promise<GroupInvitation[]> {
  const q = query(
    collection(db, 'groupInvitations'),
    where('groupId', '==', groupId),
    where('isActive', '==', true)
  );

  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      groupId: data.groupId,
      groupName: data.groupName,
      inviteCode: data.inviteCode,
      createdBy: data.createdBy,
      createdByName: data.createdByName,
      createdAt: data.createdAt?.toDate() || new Date(),
      expiresAt: data.expiresAt?.toDate() || new Date(),
      usageLimit: data.usageLimit,
      usedCount: data.usedCount || 0,
      isActive: data.isActive,
    };
  });
}

/**
 * Subscribe to real-time updates for user's groups
 */
export function subscribeToUserGroups(
  userId: string,
  callback: (groups: Group[]) => void
): Unsubscribe {
  const q = query(collection(db, 'groups'));

  return onSnapshot(q, (querySnapshot) => {
    const groups: Group[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const members = (data.members || []).map((m: FirestoreMember) => ({
        ...m,
        joinedAt: typeof m.joinedAt === 'object' && 'toDate' in m.joinedAt 
          ? m.joinedAt.toDate() 
          : m.joinedAt as Date,
      }));

      // Check if user is a member
      const isMember = members.some((m: GroupMember) => m.userId === userId);
      
      if (isMember) {
        groups.push({
          id: doc.id,
          name: data.name,
          description: data.description,
          createdBy: data.createdBy,
          cardDesign: data.cardDesign || 'sunset',
          members,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      }
    });

    callback(groups);
  });
}

/**
 * Subscribe to real-time updates for a specific group
 */
export function subscribeToGroup(
  groupId: string,
  callback: (group: Group | null) => void
): Unsubscribe {
  const groupRef = doc(db, 'groups', groupId);

  return onSnapshot(groupRef, (docSnapshot) => {
    if (!docSnapshot.exists()) {
      callback(null);
      return;
    }

    const data = docSnapshot.data();
    const members = (data.members || []).map((m: FirestoreMember) => ({
      ...m,
      joinedAt: typeof m.joinedAt === 'object' && 'toDate' in m.joinedAt 
        ? m.joinedAt.toDate() 
        : m.joinedAt as Date,
    }));

    callback({
      id: docSnapshot.id,
      name: data.name,
      description: data.description,
      createdBy: data.createdBy,
      cardDesign: data.cardDesign || 'sunset',
      members,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    });
  });
}
