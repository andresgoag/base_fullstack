export interface paths {
  "/api/v1/auth/jwt/blacklist/": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * @description Takes a token and blacklists it. Must be used with the
     *     `rest_framework_simplejwt.token_blacklist` app installed.
     */
    post: operations["auth_jwt_blacklist_create"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/auth/jwt/create/": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * @description Takes a set of user credentials and returns an access and refresh JSON web
     *     token pair to prove the authentication of those credentials.
     */
    post: operations["auth_jwt_create_create"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/auth/jwt/refresh/": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * @description Takes a refresh type JSON web token and returns an access type JSON web
     *     token if the refresh token is valid.
     */
    post: operations["auth_jwt_refresh_create"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/auth/users/": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations["auth_users_list"];
    put?: never;
    post: operations["auth_users_create"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/auth/users/{id}/": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations["auth_users_retrieve"];
    put: operations["auth_users_update"];
    post?: never;
    delete: operations["auth_users_destroy"];
    options?: never;
    head?: never;
    patch: operations["auth_users_partial_update"];
    trace?: never;
  };
  "/api/v1/auth/users/activation/": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: operations["auth_users_activation_create"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/auth/users/me/": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations["auth_users_me_retrieve"];
    put: operations["auth_users_me_update"];
    post?: never;
    delete: operations["auth_users_me_destroy"];
    options?: never;
    head?: never;
    patch: operations["auth_users_me_partial_update"];
    trace?: never;
  };
  "/api/v1/auth/users/resend_activation/": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: operations["auth_users_resend_activation_create"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/auth/users/reset_email/": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: operations["auth_users_reset_email_create"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/auth/users/reset_email_confirm/": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: operations["auth_users_reset_email_confirm_create"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/auth/users/reset_password/": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: operations["auth_users_reset_password_create"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/auth/users/reset_password_confirm/": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: operations["auth_users_reset_password_confirm_create"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/auth/users/set_email/": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: operations["auth_users_set_email_create"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/auth/users/set_password/": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: operations["auth_users_set_password_create"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/comments/similar/": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations["comments_similar_retrieve"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
}
export type webhooks = Record<string, never>;
export interface components {
  schemas: {
    Activation: {
      uid: string;
      token: string;
    };
    ActivationRequest: {
      uid: string;
      token: string;
    };
    PasswordResetConfirmRetype: {
      uid: string;
      token: string;
      new_password: string;
      re_new_password: string;
    };
    PasswordResetConfirmRetypeRequest: {
      uid: string;
      token: string;
      new_password: string;
      re_new_password: string;
    };
    PatchedUserRequest: {
      /** Format: email */
      email?: string;
      phone?: string;
      first_name?: string;
      last_name?: string;
    };
    SendEmailReset: {
      /** Format: email */
      email: string;
    };
    SendEmailResetRequest: {
      /** Format: email */
      email: string;
    };
    SetPasswordRetype: {
      new_password: string;
      re_new_password: string;
      current_password: string;
    };
    SetPasswordRetypeRequest: {
      new_password: string;
      re_new_password: string;
      current_password: string;
    };
    SetUsername: {
      current_password: string;
      /**
       * Email
       * Format: email
       */
      new_email: string;
    };
    SetUsernameRequest: {
      current_password: string;
      /**
       * Email
       * Format: email
       */
      new_email: string;
    };
    SimilarComment: {
      readonly id: number;
      readonly text: string;
      /** Format: date-time */
      readonly created_at: string;
      /** Format: double */
      readonly distance: number;
    };
    TokenBlacklistRequest: {
      refresh: string;
    };
    TokenObtainPair: {
      readonly access: string;
      readonly refresh: string;
    };
    TokenObtainPairRequest: {
      email: string;
      password: string;
    };
    TokenRefresh: {
      readonly access: string;
      refresh: string;
    };
    TokenRefreshRequest: {
      refresh: string;
    };
    User: {
      readonly id: number;
      /** Format: email */
      email: string;
      phone: string;
      first_name: string;
      last_name: string;
    };
    UserCreatePasswordRetype: {
      phone: string;
      first_name: string;
      last_name: string;
      /** Format: email */
      email: string;
      readonly id: number;
      re_password: string;
    };
    UserCreatePasswordRetypeRequest: {
      phone: string;
      first_name: string;
      last_name: string;
      /** Format: email */
      email: string;
      password: string;
      re_password: string;
    };
    UserRequest: {
      /** Format: email */
      email: string;
      phone: string;
      first_name: string;
      last_name: string;
    };
    UsernameResetConfirm: {
      /**
       * Email
       * Format: email
       */
      new_email: string;
    };
    UsernameResetConfirmRequest: {
      /**
       * Email
       * Format: email
       */
      new_email: string;
    };
  };
  responses: never;
  parameters: never;
  requestBodies: never;
  headers: never;
  pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
  auth_jwt_blacklist_create: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["TokenBlacklistRequest"];
        "application/x-www-form-urlencoded": components["schemas"]["TokenBlacklistRequest"];
        "multipart/form-data": components["schemas"]["TokenBlacklistRequest"];
      };
    };
    responses: {
      /** @description No response body */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  auth_jwt_create_create: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["TokenObtainPairRequest"];
        "application/x-www-form-urlencoded": components["schemas"]["TokenObtainPairRequest"];
        "multipart/form-data": components["schemas"]["TokenObtainPairRequest"];
      };
    };
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["TokenObtainPair"];
        };
      };
    };
  };
  auth_jwt_refresh_create: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["TokenRefreshRequest"];
        "application/x-www-form-urlencoded": components["schemas"]["TokenRefreshRequest"];
        "multipart/form-data": components["schemas"]["TokenRefreshRequest"];
      };
    };
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["TokenRefresh"];
        };
      };
    };
  };
  auth_users_list: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["User"][];
        };
      };
    };
  };
  auth_users_create: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["UserCreatePasswordRetypeRequest"];
        "application/x-www-form-urlencoded": components["schemas"]["UserCreatePasswordRetypeRequest"];
        "multipart/form-data": components["schemas"]["UserCreatePasswordRetypeRequest"];
      };
    };
    responses: {
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["UserCreatePasswordRetype"];
        };
      };
    };
  };
  auth_users_retrieve: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description A unique integer value identifying this user. */
        id: number;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["User"];
        };
      };
    };
  };
  auth_users_update: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description A unique integer value identifying this user. */
        id: number;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["UserRequest"];
        "application/x-www-form-urlencoded": components["schemas"]["UserRequest"];
        "multipart/form-data": components["schemas"]["UserRequest"];
      };
    };
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["User"];
        };
      };
    };
  };
  auth_users_destroy: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description A unique integer value identifying this user. */
        id: number;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description No response body */
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  auth_users_partial_update: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description A unique integer value identifying this user. */
        id: number;
      };
      cookie?: never;
    };
    requestBody?: {
      content: {
        "application/json": components["schemas"]["PatchedUserRequest"];
        "application/x-www-form-urlencoded": components["schemas"]["PatchedUserRequest"];
        "multipart/form-data": components["schemas"]["PatchedUserRequest"];
      };
    };
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["User"];
        };
      };
    };
  };
  auth_users_activation_create: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["ActivationRequest"];
        "application/x-www-form-urlencoded": components["schemas"]["ActivationRequest"];
        "multipart/form-data": components["schemas"]["ActivationRequest"];
      };
    };
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["Activation"];
        };
      };
    };
  };
  auth_users_me_retrieve: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["User"];
        };
      };
    };
  };
  auth_users_me_update: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["UserRequest"];
        "application/x-www-form-urlencoded": components["schemas"]["UserRequest"];
        "multipart/form-data": components["schemas"]["UserRequest"];
      };
    };
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["User"];
        };
      };
    };
  };
  auth_users_me_destroy: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description No response body */
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  auth_users_me_partial_update: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: {
      content: {
        "application/json": components["schemas"]["PatchedUserRequest"];
        "application/x-www-form-urlencoded": components["schemas"]["PatchedUserRequest"];
        "multipart/form-data": components["schemas"]["PatchedUserRequest"];
      };
    };
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["User"];
        };
      };
    };
  };
  auth_users_resend_activation_create: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["SendEmailResetRequest"];
        "application/x-www-form-urlencoded": components["schemas"]["SendEmailResetRequest"];
        "multipart/form-data": components["schemas"]["SendEmailResetRequest"];
      };
    };
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["SendEmailReset"];
        };
      };
    };
  };
  auth_users_reset_email_create: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["SendEmailResetRequest"];
        "application/x-www-form-urlencoded": components["schemas"]["SendEmailResetRequest"];
        "multipart/form-data": components["schemas"]["SendEmailResetRequest"];
      };
    };
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["SendEmailReset"];
        };
      };
    };
  };
  auth_users_reset_email_confirm_create: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["UsernameResetConfirmRequest"];
        "application/x-www-form-urlencoded": components["schemas"]["UsernameResetConfirmRequest"];
        "multipart/form-data": components["schemas"]["UsernameResetConfirmRequest"];
      };
    };
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["UsernameResetConfirm"];
        };
      };
    };
  };
  auth_users_reset_password_create: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["SendEmailResetRequest"];
        "application/x-www-form-urlencoded": components["schemas"]["SendEmailResetRequest"];
        "multipart/form-data": components["schemas"]["SendEmailResetRequest"];
      };
    };
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["SendEmailReset"];
        };
      };
    };
  };
  auth_users_reset_password_confirm_create: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["PasswordResetConfirmRetypeRequest"];
        "application/x-www-form-urlencoded": components["schemas"]["PasswordResetConfirmRetypeRequest"];
        "multipart/form-data": components["schemas"]["PasswordResetConfirmRetypeRequest"];
      };
    };
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["PasswordResetConfirmRetype"];
        };
      };
    };
  };
  auth_users_set_email_create: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["SetUsernameRequest"];
        "application/x-www-form-urlencoded": components["schemas"]["SetUsernameRequest"];
        "multipart/form-data": components["schemas"]["SetUsernameRequest"];
      };
    };
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["SetUsername"];
        };
      };
    };
  };
  auth_users_set_password_create: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["SetPasswordRetypeRequest"];
        "application/x-www-form-urlencoded": components["schemas"]["SetPasswordRetypeRequest"];
        "multipart/form-data": components["schemas"]["SetPasswordRetypeRequest"];
      };
    };
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["SetPasswordRetype"];
        };
      };
    };
  };
  comments_similar_retrieve: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["SimilarComment"];
        };
      };
    };
  };
}
