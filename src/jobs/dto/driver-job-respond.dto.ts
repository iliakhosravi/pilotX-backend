import { IsBoolean } from 'class-validator';

export class DriverJobRespondDto {
  @IsBoolean()
  accept: boolean;
}
