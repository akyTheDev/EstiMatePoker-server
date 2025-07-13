import {
  ClearVoteHandler,
  CreateRoomHandler,
  JoinRoomHandler,
  VoteHandler,
  RevealVoteHandler,
} from '@/applications/room/commands'
import { IRoomPubSub, IRoomRepository } from '@/domain/room'
import { DIContainer } from '@/domain/shared'
import { RedisPubSub } from '@/infrastructure/messaging/redis'
import { RedisRoomRepository } from '@/infrastructure/persistence/redis'
import { RedisManager } from '@/infrastructure/redis'
import { WsController } from '@/infrastructure/web/websocket'

export const configureContainer = async (): Promise<DIContainer> => {
  const container = new DIContainer()

  const redisManager = new RedisManager()
  await redisManager.connect()
  container.register('RedisManager', redisManager)

  // Register Infrastructure Adapters ---
  container.register<IRoomRepository>(
    'RoomRepository',
    new RedisRoomRepository(
      container.resolve<RedisManager>('RedisManager').getClient(),
    ),
  )
  container.register<IRoomPubSub>(
    'RoomPubSub',
    new RedisPubSub(
      container.resolve<RedisManager>('RedisManager').getClient(),
    ),
  )

  // Register Application Handlers ---
  container.register(
    'CreateRoomHandler',
    new CreateRoomHandler(
      container.resolve<IRoomRepository>('RoomRepository'),
      container.resolve<IRoomPubSub>('RoomPubSub'),
    ),
  )
  container.register(
    'JoinRoomHandler',
    new JoinRoomHandler(
      container.resolve<IRoomRepository>('RoomRepository'),
      container.resolve<IRoomPubSub>('RoomPubSub'),
    ),
  )
  container.register(
    'VoteHandler',
    new VoteHandler(
      container.resolve<IRoomRepository>('RoomRepository'),
      container.resolve<IRoomPubSub>('RoomPubSub'),
    ),
  )
  container.register(
    'RevealVoteHandler',
    new RevealVoteHandler(
      container.resolve<IRoomRepository>('RoomRepository'),
      container.resolve<IRoomPubSub>('RoomPubSub'),
    ),
  )
  container.register(
    'ClearVoteHandler',
    new ClearVoteHandler(
      container.resolve<IRoomRepository>('RoomRepository'),
      container.resolve<IRoomPubSub>('RoomPubSub'),
    ),
  )

  // Register Inbound Adapters
  container.register(
    'WsController',
    new WsController({
      createRoomHandler:
        container.resolve<CreateRoomHandler>('CreateRoomHandler'),
      joinRoomHandler: container.resolve<JoinRoomHandler>('JoinRoomHandler'),
      voteHandler: container.resolve<VoteHandler>('VoteHandler'),
      revealVoteHandler:
        container.resolve<RevealVoteHandler>('RevealVoteHandler'),
      clearVoteHandler: container.resolve<ClearVoteHandler>('ClearVoteHandler'),
    }),
  )

  return container
}
