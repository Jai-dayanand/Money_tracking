export type User = {
  id: string;
  email: string;
  name: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user: User;
};
