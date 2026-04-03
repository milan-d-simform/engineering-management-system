import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto): Promise<{
    accessToken: string;
    refreshToken: string;
    user: UserDocument;
  }> {
    const user = await this.usersService.findByEmail(loginDto.email, true);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user);
    await this.usersService.setRefreshToken(user.id, tokens.refreshToken);

    // Don't return password
    const userObj = user.toJSON();
    return { ...tokens, user: userObj as UserDocument };
  }

  async refresh(userId: string, refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const user = await this.usersService.findWithRefreshToken(userId);
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access denied');
    }

    const tokenMatch = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!tokenMatch) {
      throw new UnauthorizedException('Access denied');
    }

    const tokens = await this.generateTokens(user);
    await this.usersService.setRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.setRefreshToken(userId, null);
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.usersService.findByEmail(dto.email);
    // Always return success to prevent email enumeration
    if (!user) return;

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.usersService.setPasswordResetToken(user.id, token, expires);
    await this.sendPasswordResetEmail(user.email, token);
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const user = await this.usersService.findByPasswordResetToken(dto.token);
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }
    await this.usersService.updatePassword(user.id, dto.newPassword);
  }

  private async generateTokens(user: UserDocument): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.accessSecret') as string,
        expiresIn: this.configService.get('jwt.accessExpiresIn') as unknown as number,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret') as string,
        expiresIn: this.configService.get('jwt.refreshExpiresIn') as unknown as number,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async verifyRefreshToken(
    token: string,
  ): Promise<{ sub: string; email: string }> {
    try {
      return this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('app.frontendUrl');
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    const transporter = nodemailer.createTransport({
      host: this.configService.get<string>('mail.host'),
      port: this.configService.get<number>('mail.port'),
      auth: {
        user: this.configService.get<string>('mail.user'),
        pass: this.configService.get<string>('mail.pass'),
      },
    });

    await transporter.sendMail({
      from: this.configService.get<string>('mail.from'),
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h2>Password Reset</h2>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="background:#4F46E5;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">
          Reset Password
        </a>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    });
  }
}
