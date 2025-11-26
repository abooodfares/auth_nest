import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordService {
    async hashPassword(password: string): Promise<string> {
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS!);
        return bcrypt.hash(password, saltRounds);
    }
    
    async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
        return bcrypt.compare(password, hashedPassword);
    }
}
