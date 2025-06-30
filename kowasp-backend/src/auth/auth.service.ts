import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signUp(createUserDto: CreateUserDto) {
    const { email, password } = createUserDto;
    const existingUser = await this.usersService.findOneByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await this.usersService.create({
      email,
      passwordHash: hashedPassword,
    });

    // Create JWT payload
    const payload = { email: user.email, sub: user._id, role: user.role };
    
    // Exclude password from the returned user object
    const { passwordHash, ...userData } = user.toObject();
    
    return {
      access_token: this.jwtService.sign(payload),
      user: userData,
    };
  }

  async login(dto: LoginUserDto): Promise<any> {
    const user = await this.usersService.findOneByEmail(dto.email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!dto.password) {
      throw new UnauthorizedException('Password is required');
    }
    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { email: user.email, sub: user._id, role: user.role };
    
    // Exclude password from the returned user object
    const { passwordHash, ...userData } = user.toObject();
    
    return {
      access_token: this.jwtService.sign(payload),
      user: userData,
    };
  }
} 