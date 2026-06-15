import { Test, TestingModule } from '@nestjs/testing';

process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test';

import { TreesService } from './trees.service';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from './ai.service';
import { GitHubService } from '../github/github.service';

describe('TreesService', () => {
  let service: TreesService;
  let prisma: {
    user: {
      findMany: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TreesService,
        { provide: PrismaService, useValue: prisma },
        { provide: AiService, useValue: {} },
        { provide: GitHubService, useValue: {} },
      ],
    }).compile();

    service = module.get<TreesService>(TreesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('includes connected users in explore even before they have synced any verified skills', async () => {
    prisma.user.findMany.mockResolvedValue([
      {
        handle: 'fresh-dev',
        name: 'Fresh Dev',
        githubUsername: 'fresh-dev',
        trees: [],
      },
      {
        handle: 'mapped-dev',
        name: 'Mapped Dev',
        githubUsername: 'mapped-dev',
        trees: [
          {
            nodes: [
              { title: 'TypeScript', icon: 'code' },
              { title: 'Angular', icon: 'web' },
            ],
          },
        ],
      },
    ]);

    await expect(service.getExploreProfiles()).resolves.toEqual([
      {
        handle: 'fresh-dev',
        name: 'Fresh Dev',
        githubUsername: 'fresh-dev',
        verifiedSkills: 0,
        topSkills: [],
      },
      {
        handle: 'mapped-dev',
        name: 'Mapped Dev',
        githubUsername: 'mapped-dev',
        verifiedSkills: 2,
        topSkills: ['TypeScript', 'Angular'],
      },
    ]);
  });
});
