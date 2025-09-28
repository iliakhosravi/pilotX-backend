import { Test, TestingModule } from '@nestjs/testing';
import { DriversController } from './drivers.controller';
import { JwtAuthGuard } from '../auth/jwt.guard';

describe('DriversController', () => {
  let controller: DriversController;
  let mockRedis: any;

  beforeEach(async () => {
    mockRedis = {
      geoadd: jest.fn().mockResolvedValue(1),
      hset: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(1),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DriversController],
      providers: [
        {
          provide: 'REDIS',
          useValue: mockRedis,
        },
      ],
    })
    .overrideGuard(JwtAuthGuard)
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<DriversController>(DriversController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('updateLocation', () => {
    it('should update driver location using authenticated user ID', async () => {
      const mockReq = {
        user: { driverId: 'driver123' }
      } as any;
      
      const locationDto = { lat: 37.7749, lng: -122.4194 };

      const result = await controller.updateLocation(mockReq, locationDto);

      expect(mockRedis.geoadd).toHaveBeenCalledWith(
        'drivers:locations', 
        -122.4194, 
        37.7749, 
        'driver123'
      );
      expect(mockRedis.hset).toHaveBeenCalledWith(
        'driver:driver123',
        'lat', '37.7749',
        'lng', '-122.4194'
      );
      expect(mockRedis.expire).toHaveBeenCalledWith('driver:driver123', 60);
      expect(result).toEqual({ ok: true });
    });
  });

  describe('updateAvailability', () => {
    it('should set driver as available using authenticated user ID', async () => {
      const mockReq = {
        user: { driverId: 'driver123' }
      } as any;
      
      const availabilityDto = { available: true };

      const result = await controller.updateAvailability(mockReq, availabilityDto);

      expect(mockRedis.set).toHaveBeenCalledWith('driver:driver123:available', '1');
      expect(mockRedis.hset).toHaveBeenCalledWith(
        'driver:driver123',
        'availableAt',
        expect.any(String)
      );
      expect(result).toEqual({ ok: true });
    });

    it('should set driver as unavailable using authenticated user ID', async () => {
      const mockReq = {
        user: { driverId: 'driver123' }
      } as any;
      
      const availabilityDto = { available: false };

      await controller.updateAvailability(mockReq, availabilityDto);

      expect(mockRedis.del).toHaveBeenCalledWith('driver:driver123:available');
    });
  });
});
