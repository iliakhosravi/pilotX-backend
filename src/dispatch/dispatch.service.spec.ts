import { DispatchService } from './dispatch.service';
import { DispatchGateway } from './dispatch.gateway';

// Test for Dispatch Service (Q2)

const redisMock: any = {
  sendCommand: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

const gatewayMock: any = {
  sendJobToDriver: jest.fn(),
};

describe('DispatchService', () => {
  let service: DispatchService;

  beforeEach(() => {
    service = new DispatchService(redisMock, gatewayMock);
    jest.clearAllMocks();
  });

  it('should return no driver if none in radius', async () => {
    redisMock.sendCommand.mockResolvedValue([]);
    const res = await service.matchAndAssign({ orderId: 'O1', pickupLat: 0, pickupLng: 0 });
    expect(res.driverId).toBeNull();
  });

  it('should attempt to assign driver if available', async () => {
    redisMock.sendCommand.mockResolvedValue([['driver1', '100']]);
    
    // Mock the sequence of redis.get calls:
    // 1st call: check if driver is available
    // 2nd call: poll for accept response
    redisMock.get
      .mockResolvedValueOnce('1') // driver is available
      .mockResolvedValueOnce('accepted'); // driver accepts the job
    
    redisMock.set.mockResolvedValue('OK'); // lock acquired
    gatewayMock.sendJobToDriver.mockReturnValue(true);
    
    const res = await service.matchAndAssign({ orderId: 'O1', pickupLat: 0, pickupLng: 0 });
    expect(res.driverId).toBe('driver1');
  });
});
