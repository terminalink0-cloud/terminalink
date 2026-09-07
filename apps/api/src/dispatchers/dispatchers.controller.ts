import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';


import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';


import {
  DispatchersService,
} from './dispatchers.service';


import {
  CreateDispatcherDto,
} from './dto/create-dispatcher.dto';


import {
  UpdateDispatcherDto,
} from './dto/update-dispatcher.dto';


import {
  JwtAuthGuard,
} from '../auth/guards/jwt.guard';



@ApiTags('Dispatchers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)

@Controller('dispatchers')
export class DispatchersController {


constructor(
 private readonly service:DispatchersService,
){}



@Post()

@ApiOperation({
 summary:'Create dispatcher'
})

create(
 @Body() dto:CreateDispatcherDto
){

return this.service.create(dto);

}





@Get()

@ApiOperation({
 summary:'List dispatchers'
})

findAll(){

return this.service.findAll();

}





@Get(':id')

@ApiOperation({
 summary:'Get dispatcher'
})

findOne(
 @Param('id') id:string
){

return this.service.findOne(id);

}





@Patch(':id')

@ApiOperation({
 summary:'Update dispatcher'
})

update(
 @Param('id') id:string,
 @Body() dto:UpdateDispatcherDto
){

return this.service.update(
 id,
 dto
);

}





@Delete(':id')

@ApiOperation({
 summary:'Delete dispatcher'
})

remove(
 @Param('id') id:string
){

return this.service.remove(id);

}


}