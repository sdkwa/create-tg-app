import type { AxiosInstance } from 'axios'
import type { ITelegramApp, TelegramApp, TelegramAppAuthParams, TelegramAppCredentials } from './telegram-app.types'
import axios from 'axios'
import * as cheerio from 'cheerio'
import * as https from 'node:https';
import { TelegramAppRoutes } from './telegram-app.types'

export interface TelegramAppClientOptions {
    httpsAgent: https.Agent
}

export class TelegramAppClient implements ITelegramApp {
    private readonly _client: AxiosInstance
    constructor(opts?: TelegramAppClientOptions) {
        this._client = axios.create({
            baseURL: 'https://my.telegram.org',
            timeout: 4000,
            httpsAgent: opts?.httpsAgent || false
        })
    }

    private cookieName = 'stel_token'

    private getCookieValue(cookiesArray: Array<string>, cookieName: string) {
        for (const cookieStr of cookiesArray) {
            const cookie = cookieStr.split(';')[0].trim()
            if (cookie.startsWith(`${cookieName}=`)) {
                return cookie.split('=')[1]
            }
        }
        return null
    }

    private normalizePhoneNumber(input: string) {
        input = input.trim().replace(/[+()\s-]/g, '')
        if (!input.match(/^\d+$/)) throw new Error('Invalid phone number')

        return input
    }

    async sendConfirmationCode(phoneNumber: string): Promise<string | null> {
        const phone = this.normalizePhoneNumber(phoneNumber)
        const res = await this._client.post(
            TelegramAppRoutes.SEND_PASSWORD,
            { phone },
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' } },
        )
        return res.data.random_hash
    }

    async createApp(
        token: string,
        appParams: TelegramApp,
    ): Promise<TelegramApp> {
        const existingApp = await this.getCredentials(token);
        if(existingApp.apiHash && existingApp.apiId)
            throw new Error(`Telegram app already exist. You can create one application per phone number. Credentials: ${JSON.stringify(existingApp)}`);

        const resultHtml = await this._client.get(TelegramAppRoutes.APPS, {
            headers: { Cookie: `stel_token=${token}` },
        })
        const $ = cheerio.load(resultHtml.data)
        const hash = $('input[name="hash"]').val()

        const res = await this._client.post(TelegramAppRoutes.CREATE_APP, {
            ...appParams,
            hash,
        }, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Cookie': `stel_token=${token}`,
            },
        })

        if (typeof res.data === 'string') {
            const stringResult = res.data.toLowerCase()
            if (stringResult.includes('incorrect') || stringResult.includes('error')) {
                throw new Error(stringResult)
            }

            if (stringResult.trim().length === 0) {
                return appParams
            }
        }

        return appParams
    }

    async getCredentials(token: string): Promise<TelegramAppCredentials> {
        const resultHtml = await this._client.get(TelegramAppRoutes.APPS, {
            headers: { Cookie: `stel_token=${token}` },
        })

        const credentials = await this.parseApiCredentials(resultHtml.data);

        if (!credentials.apiId) {
            throw new Error("Couldn't find apiId. Try again")
        }

        if (!credentials.apiHash) {
            throw new Error("Couldn't find apiHash. Try again")
        }

        return credentials
    }

    private async parseApiCredentials(rawHtml: string) {
        const $ = cheerio.load(rawHtml)
        const formGroups = $('.form-group')

        const result: TelegramAppCredentials = {
            apiId: '',
            apiHash: '',
        }

        for (const group of formGroups) {
            const apiIdElement = $(group).find('label')
            if (apiIdElement.attr('for')?.toLowerCase() === 'app_id') {
                const value = apiIdElement.next().find('span').text()
                result.apiId = value
            }

            if (apiIdElement.attr('for')?.toLowerCase() === 'app_hash') {
                const value = apiIdElement.next().find('span').text()
                result.apiHash = value
            }
        }

        return result;
    }

    async signIn(params: TelegramAppAuthParams): Promise<string> {
        const phoneNumber = this.normalizePhoneNumber(params.phone)
        const res = await this._client.post(
            TelegramAppRoutes.AUTH,
            {
                phone: phoneNumber,
                random_hash: params.random_hash,
                password: params.code,
            },
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' } },
        )

        if (res.data === 'Invalid confirmation code!') {
            throw new Error('Invalid confirmation code or hash')
        }

        const cookies = res.headers['set-cookie']
        if (!cookies) {
            throw new Error("Not found 'Set-Cookie' on response headers")
        }

        const cookie = this.getCookieValue(cookies, this.cookieName)

        if (!cookie) {
            throw new Error('Not found needed cookie')
        }

        return cookie
    }
}
