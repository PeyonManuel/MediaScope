// // src/components/UserLists.tsx
// import React from 'react';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { useNavigate } from '@tanstack/react-router'; // Or your specific router import

// // Props for the component, if any are needed from the tab parent
// interface UserListsProps {
//   // Example: userId?: string; (if lists depend on a specific user ID passed as prop)
// }
// const listQueryKeys = {
//   all: ['lists'] as const, // Base key for all list-related queries
//   lists: () => [...listQueryKeys.all, 'user'] as const, // Key for fetching all user lists
//   list: (id: string) => [...listQueryKeys.lists(), id] as const,
// };
// const UserLists: React.FC<UserListsProps> = (/* props */) => {
//   const navigate = useNavigate();
//   const queryClient = useQueryClient();

//   const {
//     data: lists,
//     isLoading,
//     isError,
//     error,
//   } = useQuery<UserList[], Error>({
//     queryKey: listQueryKeys.lists(), // Use the defined query key
//     queryFn: fetchUserListsAPI, // The function to fetch data
//   });

//   const createListMutation = useMutation<UserList, Error, CreateListPayload>({
//     mutationFn: createListAPI,
//     onSuccess: (newList) => {
//       queryClient.invalidateQueries({ queryKey: listQueryKeys.lists() });
//       console.log('New list created:', newList);
//       alert(`List "${newList.name}" created!`); // Placeholder
//     },
//     onError: (err) => {
//       console.error('Error creating list:', err.message);
//       alert(`Error creating list: ${err.message}`);
//     },
//   });

//   const handleCreateNewList = () => {
//     const listName = prompt('Enter the name for the new list:');
//     if (listName && listName.trim() !== '') {
//       createListMutation.mutate({ name: listName.trim() });
//     }
//   };

//   if (isLoading) {
//     return <div>Loading your lists...</div>;
//   }

//   if (isError) {
//     return <div>Error fetching lists: {error?.message || 'Unknown error'}</div>;
//   }

//   return (
//     <div>
//       <h2>My Lists</h2>
//       <button
//         onClick={handleCreateNewList}
//         disabled={createListMutation.isPending}>
//         {createListMutation.isPending ? 'Creating...' : 'Create New List'}
//       </button>

//       {lists && lists.length > 0 ?
//         <ul>
//           {lists.map((list) => (
//             <li key={list.id}>{list.name}</li>
//           ))}
//         </ul>
//       : <p>You don't have any lists yet. Create one!</p>}
//     </div>
//   );
// };

// export default UserLists;
