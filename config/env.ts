/**
 * Sauce Demo public credentials — not secrets; documented on saucedemo.com.
 */
export const config = {
  baseURL: process.env.BASE_URL ?? 'https://www.saucedemo.com',
  users: {
    standard: {
      username: process.env.SAUCE_USER ?? 'standard_user',
      password: process.env.SAUCE_PASSWORD ?? 'secret_sauce',
    },
    locked: {
      username: 'locked_out_user',
      password: process.env.SAUCE_PASSWORD ?? 'secret_sauce',
    },
  },
} as const;
