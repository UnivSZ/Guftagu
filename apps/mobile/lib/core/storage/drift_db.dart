import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';

part 'drift_db.g.dart';

class Conversations extends Table {
  TextColumn get id => text()();
  TextColumn get type => text()(); // DIRECT, GROUP
  TextColumn get name => text().nullable()();
  TextColumn get displayName => text().nullable()();
  TextColumn get avatarUrl => text().nullable()();
  TextColumn get lastMessagePreview => text().nullable()();
  DateTimeColumn get lastMessageAt => dateTime().nullable()();
  IntColumn get unreadCount => integer().withDefault(const Constant(0))();
  BoolColumn get isPinned => boolean().withDefault(const Constant(false))();
  BoolColumn get isArchived => boolean().withDefault(const Constant(false))();
  DateTimeColumn get mutedUntil => dateTime().nullable()();
  TextColumn get theme => text().nullable()();
  @override
  Set<Column> get primaryKey => {id};
}

class Messages extends Table {
  TextColumn get id => text()();
  TextColumn get clientMessageId => text()();
  TextColumn get conversationId => text()();
  TextColumn get senderId => text()();
  TextColumn get senderName => text().nullable()();
  TextColumn get body => text().nullable()();
  TextColumn get type => text().withDefault(const Constant('TEXT'))();
  IntColumn get sequenceNumber => integer()();
  TextColumn get replyToId => text().nullable()();
  BoolColumn get isEdited => boolean().withDefault(const Constant(false))();
  BoolColumn get isForwarded => boolean().withDefault(const Constant(false))();
  BoolColumn get isDeletedForEveryone => boolean().withDefault(const Constant(false))();
  TextColumn get status => text().withDefault(const Constant('SENT'))(); // PENDING, SENT, DELIVERED, READ
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime().nullable()();
  @override
  Set<Column> get primaryKey => {id};
}

class QueuedMessages extends Table {
  TextColumn get clientMessageId => text()();
  TextColumn get conversationId => text()();
  TextColumn get body => text().nullable()();
  TextColumn get type => text().withDefault(const Constant('TEXT'))();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
  IntColumn get retryCount => integer().withDefault(const Constant(0))();
  @override
  Set<Column> get primaryKey => {clientMessageId};
}

class Drafts extends Table {
  TextColumn get conversationId => text()();
  TextColumn get text => text()();
  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();
  @override
  Set<Column> get primaryKey => {conversationId};
}

@DriftDatabase(tables: [Conversations, Messages, QueuedMessages, Drafts])
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(driftDatabase(name: 'guftagu_db'));

  @override
  int get schemaVersion => 1;

  // Conversations
  Future<List<Conversation>> getAllConversations() => select(conversations).get();
  Future<void> upsertConversation(ConversationsCompanion conv) => into(conversations).insertOnConflictUpdate(conv);
  Stream<List<Conversation>> watchConversations() {
    return (select(conversations)..orderBy([(t) => OrderingTerm.desc(t.lastMessageAt), (t) => OrderingTerm.desc(t.isPinned)])).watch();
  }

  // Messages
  Future<List<Message>> getMessagesForConversation(String convId, {int limit = 50, int offset = 0}) {
    return (select(messages)..where((t) => t.conversationId.equals(convId))..orderBy([(t) => OrderingTerm.desc(t.sequenceNumber)])..limit(limit, offset: offset)).get();
  }

  Stream<List<Message>> watchMessages(String convId) {
    return (select(messages)..where((t) => t.conversationId.equals(convId))..orderBy([(t) => OrderingTerm.asc(t.sequenceNumber)])).watch();
  }

  Future<void> upsertMessage(MessagesCompanion msg) => into(messages).insertOnConflictUpdate(msg);
  Future<void> deleteMessage(String id) => (delete(messages)..where((t) => t.id.equals(id))).go();

  // Queue
  Future<void> enqueue(QueuedMessagesCompanion q) => into(queuedMessages).insertOnConflictUpdate(q);
  Future<List<QueuedMessage>> getQueued() => select(queuedMessages).get();
  Future<void> dequeue(String clientId) => (delete(queuedMessages)..where((t) => t.clientMessageId.equals(clientId))).go();

  // Drafts
  Future<void> saveDraft(String convId, String text) => into(drafts).insertOnConflictUpdate(DraftsCompanion(conversationId: Value(convId), text: Value(text), updatedAt: Value(DateTime.now())));
  Future<Draft?> getDraft(String convId) => (select(drafts)..where((t) => t.conversationId.equals(convId))).getSingleOrNull();
}
