import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';

class LlmRequestDto {
  prompt: string;
}

class AnalyzeRequestDto {
  code: string;
  filename?: string;
}

class LlmReviewRequestDto {
  findings: any[];
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): Object {
    return this.appService.getHello();
  }

  @Get("/health")
  getHealth(): string {
    return this.appService.getHealth();
  }

  @Post('/llm')
  async llmProxy(@Body() body: LlmRequestDto) {
    return this.appService.proxyToOllama(body.prompt);
  }

  @Post('/analyze')
  async analyze(@Body() body: AnalyzeRequestDto) {
    return this.appService.staticAnalyze(body.code, body.filename);
  }

  @Post('/llm-review')
  async llmReview(@Body() body: LlmReviewRequestDto) {
    return this.appService.llmReview(body.findings);
  }
}
