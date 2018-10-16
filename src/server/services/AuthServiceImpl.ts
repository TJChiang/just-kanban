import {IAuthService} from "./interfaces/IAuthService";
import {IUserRepository, JwtPayload, User} from "../repository";
import {inject, injectable} from "inversify";
import {sign, verify} from "jsonwebtoken";
import {TYPES} from "../ioc";
import AuthError from "./exceptions/AuthError";
import {UserAuthenticationDto} from "./dtos/UserAuthenticationDto";

/**
 * The implementation for authentication service
 */
@injectable()
export class AuthServiceImpl implements IAuthService {

    /**
     * constructor
     * @param userRepository User Repository
     */
    public constructor(@inject(TYPES.IUserRepository) private userRepository: IUserRepository) {
    }

    /**
     * Generate and inject new authToken and refreshToken to user.
     * @param user User entity
     * @param isLongExpiration Extend token expiration or not.
     * @return The user entity injected with new token.
     */
    private static injectNewRefreshToken(user: User, isLongExpiration: boolean): User {
        const {SECRET_KEY, LONG_EXPIRATION, NORMAL_EXPIRATION} = process.env;

        // after 10 min, use refresh token to refresh
        user.refreshToken = sign(
            {},
            SECRET_KEY,
            {
                expiresIn: isLongExpiration ? parseInt(LONG_EXPIRATION) : parseInt(NORMAL_EXPIRATION)
            }
        );

        return user;
    }

    /**
     * Generate new access token for user
     * @param username User's name
     * @param email User's email
     * @return new access token
     */
    private static newAccessToken(username: string, email: string): string {
        const {TOKEN_LIFE_USING_REFRESH, SECRET_KEY} = process.env;

        return sign(
            {username, email},
            SECRET_KEY,
            {expiresIn: parseInt(TOKEN_LIFE_USING_REFRESH)}
        );
    }


    /**
     * Add new user
     * @param user The new user that want to add.
     */
    public async addNewUser(user: User): Promise<UserAuthenticationDto> {

        // check email if is already used.
        if (await this.userRepository.getBy({email: user.email})) {
            throw new AuthError("This email has been used!");
        }

        let dto = new UserAuthenticationDto();
        dto.userDetail = await this.userRepository.add(AuthServiceImpl.injectNewRefreshToken(user, true));
        dto.accessToken = AuthServiceImpl.newAccessToken(user.username, user.email);

        return Promise.resolve(dto);
    }

    /**
     * Get user auth dto by authToken, if authToken expired, refresh authToken
     * @param accessToken access token
     * @param refreshToken Refresh token
     * @return The user passing authentication.
     */
    public async getUserAuthByToken(accessToken: string, refreshToken: string): Promise<UserAuthenticationDto> {
        const {SECRET_KEY} = process.env;
        let payload = new JwtPayload(null, null);

        // verify authToken first.
        try {
            payload = verify(accessToken, SECRET_KEY) as JwtPayload;
        } catch (err) {
            // Get user by refreshToken which is storage in database.
            let user = await this.userRepository.getBy({refreshToken});
            if (!user) {
                throw new AuthError('Cannot refresh authentication, please login again.');
            }

            // if failed, try verify refreshToken.
            try {
                verify(refreshToken, SECRET_KEY);

                // verify success, update user's refresh token.
                let updated = await this.userRepository.update(
                    AuthServiceImpl.injectNewRefreshToken(user, true)
                );

                // update payload
                Object.assign(payload, updated);
            } catch (err) {
                throw new AuthError(err.message);
            }
        }

        let dto = new UserAuthenticationDto();
        dto.accessToken = AuthServiceImpl.newAccessToken(payload.username, payload.email);
        dto.userDetail = await this.userRepository.getBy({username:payload.username, email:payload.email});

        return Promise.resolve(dto);
    }

    /**
     * User login verify
     * @param email User's email
     * @param password User's password
     * @param isRememberMe Is remember login status.
     * @return The user passing authentication.
     */
    public async verify(email: string, password: string, isRememberMe: boolean = false): Promise<UserAuthenticationDto> {
        let user = await this.userRepository.getBy({email});
        if (user.password !== password) {
            throw new AuthError('Wrong email or password!');
        }

        let dto = new UserAuthenticationDto();
        dto.userDetail = await this.userRepository.update(AuthServiceImpl.injectNewRefreshToken(user, isRememberMe));
        dto.accessToken = AuthServiceImpl.newAccessToken(user.username, user.email);

        return Promise.resolve(dto);
    }
}
