'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, CreditCard } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/contexts/auth-context';
import { createGroup } from '@/lib/firebase/groups';
import { CARD_DESIGNS, DEFAULT_CARD_DESIGN } from '@/lib/constants/card-designs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  name: z.string().min(2, 'Group name must be at least 2 characters'),
  description: z.string().optional(),
  cardDesign: z.string(),
});

type FormData = z.infer<typeof formSchema>;

export function CreateGroupDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, userProfile } = useAuth();
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      cardDesign: DEFAULT_CARD_DESIGN,
    },
  });

  async function onSubmit(data: FormData) {
    if (!user || !userProfile) {
      toast.error('You must be logged in to create a group');
      return;
    }

    setLoading(true);

    try {
      const groupId = await createGroup(
        data.name,
        data.description || '',
        user.uid,
        userProfile.email,
        userProfile.displayName,
        userProfile.photoURL,
        data.cardDesign
      );

      toast.success('Group created successfully!');
      setOpen(false);
      form.reset();
      router.push(`/dashboard/groups/${groupId}`);
    } catch (error) {
      console.error('Error creating group:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to create group. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Group
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create a new group</DialogTitle>
          <DialogDescription>
            Start tracking expenses with 2 or more people. You can invite members after creating the
            group.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Roommates, Trip to Paris" {...field} />
                  </FormControl>
                  <FormDescription>Choose a name that describes your group.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Monthly rent and utilities" {...field} />
                  </FormControl>
                  <FormDescription>Add details about what expenses you&apos;ll track.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cardDesign"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Card Design
                  </FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-2 gap-3">
                      {CARD_DESIGNS.map((design) => (
                        <button
                          key={design.id}
                          type="button"
                          onClick={() => field.onChange(design.id)}
                          className={cn(
                            'relative h-24 rounded-lg overflow-hidden transition-all',
                            'hover:scale-105 hover:shadow-lg',
                            field.value === design.id
                              ? 'ring-2 ring-primary ring-offset-2'
                              : 'ring-1 ring-border'
                          )}
                        >
                          <div className={cn('h-full w-full p-3 flex flex-col justify-between', design.gradient, design.textColor)}>
                            <div className="flex items-center gap-2">
                              <div className={cn('h-6 w-8 rounded', design.accentColor)} />
                              <div className={cn('h-4 w-4 rounded-full', design.accentColor)} />
                            </div>
                            <div className="text-left">
                              <p className="text-xs font-medium">{design.name}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormDescription>Choose a card style for your group</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Group'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
