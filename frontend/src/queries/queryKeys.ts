export const queryKeys = {
  users: {
    all: ["users"] as const,
    current: () => [...queryKeys.users.all, "me"] as const,
  },
  websocket: {
    all: ["websocket"] as const,
    room: (roomName: string) =>
      [...queryKeys.websocket.all, "room", roomName] as const,
  },
  comments: {
    all: ["comments"] as const,
    similar: (text: string) =>
      [...queryKeys.comments.all, "similar", text] as const,
  },
};
