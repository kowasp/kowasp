import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');

// Add Jest types
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeDefined(): R;
    }
  }
}

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUsersService = {
    findOneByEmail: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signUp', () => {
    it('should create a new user successfully', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        role: 'user',
        passwordHash: 'hashedpassword',
        toObject: () => ({
          _id: 'user123',
          email: 'test@example.com',
          role: 'user',
          passwordHash: 'hashedpassword',
        }),
      };

      const mockToken = 'jwt-token';

      mockUsersService.findOneByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue(mockToken);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');

      const result = await service.signUp(createUserDto);

      expect(usersService.findOneByEmail).toHaveBeenCalledWith('test@example.com');
      expect(usersService.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
      });
      expect(jwtService.sign).toHaveBeenCalled();
      expect(result).toEqual({
        access_token: mockToken,
        user: {
          _id: 'user123',
          email: 'test@example.com',
          role: 'user',
        },
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      const createUserDto: CreateUserDto = {
        email: 'existing@example.com',
        password: 'password123',
      };

      mockUsersService.findOneByEmail.mockResolvedValue({ email: 'existing@example.com' });

      await expect(service.signUp(createUserDto)).rejects.toThrow(ConflictException);
      expect(usersService.findOneByEmail).toHaveBeenCalledWith('existing@example.com');
      expect(usersService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should return access token for valid credentials', async () => {
      const loginUserDto: LoginUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        passwordHash: '$2b$10$hashedpassword',
        role: 'user',
        toObject: () => ({
          _id: 'user123',
          email: 'test@example.com',
          passwordHash: '$2b$10$hashedpassword',
          role: 'user',
        }),
      };

      const mockToken = 'jwt-token';

      mockUsersService.findOneByEmail.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue(mockToken);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginUserDto);

      expect(usersService.findOneByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', '$2b$10$hashedpassword');
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: 'test@example.com',
        sub: 'user123',
        role: 'user',
      });
      expect(result).toEqual({
        access_token: mockToken,
        user: {
          _id: 'user123',
          email: 'test@example.com',
          role: 'user',
        },
      });
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      const loginUserDto: LoginUserDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      mockUsersService.findOneByEmail.mockResolvedValue(null);

      await expect(service.login(loginUserDto)).rejects.toThrow(UnauthorizedException);
      expect(usersService.findOneByEmail).toHaveBeenCalledWith('nonexistent@example.com');
    });

    it('should throw UnauthorizedException for missing password', async () => {
      const loginUserDto: LoginUserDto = {
        email: 'test@example.com',
        password: '',
      };

      await expect(service.login(loginUserDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const loginUserDto: LoginUserDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        passwordHash: '$2b$10$hashedpassword',
        role: 'user',
        toObject: () => ({
          _id: 'user123',
          email: 'test@example.com',
          passwordHash: '$2b$10$hashedpassword',
          role: 'user',
        }),
      };

      mockUsersService.findOneByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginUserDto)).rejects.toThrow(UnauthorizedException);
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', '$2b$10$hashedpassword');
    });
  });
}); 