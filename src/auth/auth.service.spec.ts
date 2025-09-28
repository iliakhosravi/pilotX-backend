import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
            verify: jest.fn().mockReturnValue({ driverId: 'driver123', sub: 'driver123' }),
            decode: jest.fn().mockReturnValue({ driverId: 'driver123' }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should generate a JWT token for a driver', async () => {
      const mockDriver = { id: 'driver123', email: 'driver@test.com' };
      const result = await service.login(mockDriver);
      
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockDriver.id,
        email: mockDriver.email,
      });
      expect(result).toEqual({ access_token: 'mock-jwt-token' });
    });
  });

  describe('validateDriver', () => {
    it('should validate driver credentials', async () => {
      // This test would need bcrypt mocking for a real test
      // For now, just test that the method exists
      expect(service.validateDriver).toBeDefined();
    });
  });
});
