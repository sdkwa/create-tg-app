export const TelegramAppRoutes = {
    AUTH: '/auth/login',
    APPS: '/apps',
    CREATE_APP: '/apps/create',
    SEND_PASSWORD: '/auth/send_password',
} as const

export enum TelegramAppPlatformTypes {
    ANDROID = 'android',
    IOS = 'ios',
    WINDOWS_PHONE = 'wp',
    BLACKBERRY = 'bb',
    DESKTOP = 'desktop',
    WEB = 'web',
    UBUNTU_PHONE = 'ubp',
    OTHER = 'other',
}

export type TelegramAppPlatformTypesEnum = `${TelegramAppPlatformTypes}`

export interface TelegramApp {
    /**
     * App title, can be changed later
     */
    app_title: string
    /**
     * alphanumeric, 5-32 characters, can be changed later
     */
    app_shortname: string
    /**
     * App url, optional field
     */
    app_url?: string
    app_platform: TelegramAppPlatformTypesEnum
    /**
     * App description, optional field
     */
    app_dsc?: string
}

export interface TelegramAppCredentials {
    apiId: string
    apiHash: string
}

export interface TelegramAppAuthParams {
    /**
     * User's phone number in international format (e.g., "+1234567890").
     * Must include country code and be properly formatted for Telegram's authentication system.
     */
    phone: string
    /**
     * Random hash obtained from `sendConfirmatioCodeTelegramApps` response.
     */
    random_hash: string
    /**
     * Numeric verification code received via Telegram message or SMS.
     */
    code: string
}

export interface ITelegramApp {
    /**
     * Sends a confirmation code to the specified phone number for authorization on my.telegram.org.
     * @param {string} phoneNumber - Phone number in international format (e.g., "+1234567890").
     * @returns {Promise<string | null>} - Returns:
     *   - `string` containing the random password hash required for my.telegram.org login on success,
     *   - `null` if the request fails (e.g., invalid phone number or network error).
     */
    sendConfirmationCode(phoneNumber: string): Promise<string | null>

    /**
     * Creates a Telegram application with the specified parameters.
     * Parameter names are defined in the `TelegramApp` interface.
     * @param token stel_token from sign in request.
     * @param {TelegramApp} appParams - Configuration options for the Telegram app.
     *  * @returns { "ERROR" | "Invalid ..." | TelegramApp } - Possible outcomes:
     *   - `"ERROR"` or `"Invalid ..."` if any field value is invalid (per Telegram API rules),
     *   - The created `TelegramApp` object on success.
     */
    createApp(token: string, appParams: TelegramApp): Promise<TelegramApp>

    /**
     * Retrieves credentials for the created Telegram app.
     * @param {string} token - `stel_token` from the authorization request.
     * @returns {Promise<TelegramAppCredentials>} Promise that resolves with API credentials object containing:
     *   - `apiId` - Application identifier
     *   - `apiHash` - Application hash
     * @throws {Error} Throws an error if:
     *   - Token is invalid or expired
     *   - Credentials cannot be retrieved
     */
    getCredentials(token: string): Promise<TelegramAppCredentials>

    /**
     * Authenticates a user on my.telegram.org to obtain session cookies.
     */
    signIn(params: TelegramAppAuthParams): Promise<string | null>
}
