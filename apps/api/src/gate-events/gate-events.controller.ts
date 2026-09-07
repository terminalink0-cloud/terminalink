import {
 Controller,
 Post,
 Body,
 Get,
 Param,
 UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { GateEventsService } from './gate-events.service';
import { CreateGateEventDto } from './dto/create-gate-event.dto';


@Controller('gate-events')
@UseGuards(JwtAuthGuard)
export class GateEventsController {


constructor(
 private service:GateEventsService,
){}


@Post()
create(
 @Body() dto:CreateGateEventDto,
){
 return this.service.create(dto);
}



@Get('trip/:id')
findTrip(
 @Param('id') id:string,
){
 return this.service.findTripEvents(id);
}

}