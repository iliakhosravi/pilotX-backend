import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private readonly jwt: JwtService) {}

  // mock: in real app, fetch driver from DB
  private drivers = [
    { id: 'driver1', email: 'driver1@test.com', passwordHash: bcrypt.hashSync('password123', 10) },
  ];

  async validateDriver(email: string, password: string) {
    const driver = this.drivers.find((d) => d.email === email);
    if (!driver) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, driver.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return driver;
  }

  async login(driver: { id: string; email: string }) {
    const payload = { sub: driver.id, email: driver.email };
    return {
      access_token: this.jwt.sign(payload),
    };
  }
}
