import 'dart:async';
import 'package:drift/drift.dart' as drift;

// Simplified local DB - in-memory fallback, no codegen needed for APK
// Provides same API as drift version but uses in-memory maps + streams

class Conversation {
  final String id;
  final String type;
  final String? name;
  final String? displayName;
  final String? avatarUrl;
  final String? lastMessagePreview;
  final DateTime? lastMessageAt;
  final int unreadCount;
  final bool isPinned;
  final bool isArchived;
  final DateTime? mutedUntil;
  final String? theme;
  Conversation({
    required this.id,
    required this.type,
    this.name,
    this.displayName,
    this.avatarUrl,
    this.lastMessagePreview,
    this.lastMessageAt,
    this.unreadCount = 0,
    this.isPinned = false,
    this.isArchived = false,
    this.mutedUntil,
    this.theme,
  });
}

class Message {
  final String id;
  final String clientMessageId;
  final String conversationId;
  final String senderId;
  final String? senderName;
  final String? body;
  final String type;
  final int sequenceNumber;
  final String? replyToId;
  final bool isEdited;
  final bool isForwarded;
  final bool isDeletedForEveryone;
  final String status;
  final DateTime createdAt;
  final DateTime? updatedAt;
  Message({
    required this.id,
    required this.clientMessageId,
    required this.conversationId,
    required this.senderId,
    this.senderName,
    this.body,
    this.type = 'TEXT',
    required this.sequenceNumber,
    this.replyToId,
    this.isEdited = false,
    this.isForwarded = false,
    this.isDeletedForEveryone = false,
    this.status = 'SENT',
    required this.createdAt,
    this.updatedAt,
  });
}

class QueuedMessage {
  final String clientMessageId;
  final String conversationId;
  final String? body;
  final String type;
  final DateTime createdAt;
  final int retryCount;
  QueuedMessage({
    required this.clientMessageId,
    required this.conversationId,
    this.body,
    this.type = 'TEXT',
    required this.createdAt,
    this.retryCount = 0,
  });
}

class Draft {
  final String conversationId;
  final String text;
  final DateTime updatedAt;
  Draft({required this.conversationId, required this.text, required this.updatedAt});
}

class ConversationsCompanion {
  final drift.Value<String> id;
  final drift.Value<String> type;
  final drift.Value<String?> name;
  final drift.Value<String?> displayName;
  final drift.Value<String?> avatarUrl;
  final drift.Value<String?> lastMessagePreview;
  final drift.Value<DateTime?> lastMessageAt;
  final drift.Value<int> unreadCount;
  final drift.Value<bool> isPinned;
  final drift.Value<bool> isArchived;
  final drift.Value<DateTime?> mutedUntil;
  final drift.Value<String?> theme;
  ConversationsCompanion({
    required this.id,
    required this.type,
    this.name = const drift.Value.absent(),
    this.displayName = const drift.Value.absent(),
    this.avatarUrl = const drift.Value.absent(),
    this.lastMessagePreview = const drift.Value.absent(),
    this.lastMessageAt = const drift.Value.absent(),
    this.unreadCount = const drift.Value.absent(),
    this.isPinned = const drift.Value.absent(),
    this.isArchived = const drift.Value.absent(),
    this.mutedUntil = const drift.Value.absent(),
    this.theme = const drift.Value.absent(),
  });
  ConversationsCompanion.insert({
    required String id,
    required String type,
    drift.Value<String?> name = const drift.Value.absent(),
    drift.Value<String?> displayName = const drift.Value.absent(),
    drift.Value<String?> avatarUrl = const drift.Value.absent(),
    drift.Value<String?> lastMessagePreview = const drift.Value.absent(),
    drift.Value<DateTime?> lastMessageAt = const drift.Value.absent(),
    drift.Value<int> unreadCount = const drift.Value.absent(),
    drift.Value<bool> isPinned = const drift.Value.absent(),
    drift.Value<bool> isArchived = const drift.Value.absent(),
    drift.Value<DateTime?> mutedUntil = const drift.Value.absent(),
    drift.Value<String?> theme = const drift.Value.absent(),
  })  : id = drift.Value(id),
        type = drift.Value(type),
        name = name,
        displayName = displayName,
        avatarUrl = avatarUrl,
        lastMessagePreview = lastMessagePreview,
        lastMessageAt = lastMessageAt,
        unreadCount = unreadCount,
        isPinned = isPinned,
        isArchived = isArchived,
        mutedUntil = mutedUntil,
        theme = theme;
}

class MessagesCompanion {
  final drift.Value<String> id;
  final drift.Value<String> clientMessageId;
  final drift.Value<String> conversationId;
  final drift.Value<String> senderId;
  final drift.Value<String?> senderName;
  final drift.Value<String?> body;
  final drift.Value<String> type;
  final drift.Value<int> sequenceNumber;
  final drift.Value<String?> replyToId;
  final drift.Value<bool> isEdited;
  final drift.Value<bool> isForwarded;
  final drift.Value<bool> isDeletedForEveryone;
  final drift.Value<String> status;
  final drift.Value<DateTime> createdAt;
  final drift.Value<DateTime?> updatedAt;
  MessagesCompanion({
    required this.id,
    required this.clientMessageId,
    required this.conversationId,
    required this.senderId,
    this.senderName = const drift.Value.absent(),
    this.body = const drift.Value.absent(),
    this.type = const drift.Value.absent(),
    required this.sequenceNumber,
    this.replyToId = const drift.Value.absent(),
    this.isEdited = const drift.Value.absent(),
    this.isForwarded = const drift.Value.absent(),
    this.isDeletedForEveryone = const drift.Value.absent(),
    this.status = const drift.Value.absent(),
    required this.createdAt,
    this.updatedAt = const drift.Value.absent(),
  });
  MessagesCompanion.insert({
    required String id,
    required String clientMessageId,
    required String conversationId,
    required String senderId,
    drift.Value<String?> senderName = const drift.Value.absent(),
    drift.Value<String?> body = const drift.Value.absent(),
    drift.Value<String> type = const drift.Value.absent(),
    required int sequenceNumber,
    drift.Value<String?> replyToId = const drift.Value.absent(),
    drift.Value<bool> isEdited = const drift.Value.absent(),
    drift.Value<bool> isForwarded = const drift.Value.absent(),
    drift.Value<bool> isDeletedForEveryone = const drift.Value.absent(),
    drift.Value<String> status = const drift.Value.absent(),
    required DateTime createdAt,
    drift.Value<DateTime?> updatedAt = const drift.Value.absent(),
  })  : id = drift.Value(id),
        clientMessageId = drift.Value(clientMessageId),
        conversationId = drift.Value(conversationId),
        senderId = drift.Value(senderId),
        senderName = senderName,
        body = body,
        type = type,
        sequenceNumber = drift.Value(sequenceNumber),
        replyToId = replyToId,
        isEdited = isEdited,
        isForwarded = isForwarded,
        isDeletedForEveryone = isDeletedForEveryone,
        status = status,
        createdAt = drift.Value(createdAt),
        updatedAt = updatedAt;
}

class QueuedMessagesCompanion {
  final drift.Value<String> clientMessageId;
  final drift.Value<String> conversationId;
  final drift.Value<String?> body;
  final drift.Value<String> type;
  final drift.Value<DateTime> createdAt;
  final drift.Value<int> retryCount;
  QueuedMessagesCompanion({
    required this.clientMessageId,
    required this.conversationId,
    this.body = const drift.Value.absent(),
    this.type = const drift.Value.absent(),
    this.createdAt = const drift.Value.absent(),
    this.retryCount = const drift.Value.absent(),
  });
  QueuedMessagesCompanion.insert({
    required String clientMessageId,
    required String conversationId,
    drift.Value<String?> body = const drift.Value.absent(),
    drift.Value<String> type = const drift.Value.absent(),
    drift.Value<DateTime> createdAt = const drift.Value.absent(),
    drift.Value<int> retryCount = const drift.Value.absent(),
  })  : clientMessageId = drift.Value(clientMessageId),
        conversationId = drift.Value(conversationId),
        body = body,
        type = type,
        createdAt = createdAt,
        retryCount = retryCount;
}

class DraftsCompanion {
  final drift.Value<String> conversationId;
  final drift.Value<String> text;
  final drift.Value<DateTime> updatedAt;
  DraftsCompanion({
    required this.conversationId,
    required this.text,
    required this.updatedAt,
  });
}

class AppDatabase {
  final Map<String, Conversation> _conversations = {};
  final Map<String, Message> _messages = {};
  final Map<String, QueuedMessage> _queued = {};
  final Map<String, Draft> _drafts = {};
  final _convController = StreamController<List<Conversation>>.broadcast();
  final Map<String, StreamController<List<Message>>> _msgControllers = {};

  AppDatabase() {
    _convController.add([]);
  }

  Future<List<Conversation>> getAllConversations() async {
    final list = _conversations.values.toList()
      ..sort((a, b) => (b.lastMessageAt ?? DateTime.fromMillisecondsSinceEpoch(0))
          .compareTo(a.lastMessageAt ?? DateTime.fromMillisecondsSinceEpoch(0)));
    return list;
  }

  Future<void> upsertConversation(ConversationsCompanion conv) async {
    final existing = _conversations[conv.id.value];
    _conversations[conv.id.value] = Conversation(
      id: conv.id.value,
      type: conv.type.value,
      name: conv.name.present ? conv.name.value : existing?.name,
      displayName: conv.displayName.present ? conv.displayName.value : existing?.displayName,
      avatarUrl: conv.avatarUrl.present ? conv.avatarUrl.value : existing?.avatarUrl,
      lastMessagePreview: conv.lastMessagePreview.present ? conv.lastMessagePreview.value : existing?.lastMessagePreview,
      lastMessageAt: conv.lastMessageAt.present ? conv.lastMessageAt.value : existing?.lastMessageAt,
      unreadCount: conv.unreadCount.present ? conv.unreadCount.value! : existing?.unreadCount ?? 0,
      isPinned: conv.isPinned.present ? conv.isPinned.value! : existing?.isPinned ?? false,
      isArchived: conv.isArchived.present ? conv.isArchived.value! : existing?.isArchived ?? false,
      mutedUntil: conv.mutedUntil.present ? conv.mutedUntil.value : existing?.mutedUntil,
      theme: conv.theme.present ? conv.theme.value : existing?.theme,
    );
    _convController.add(await getAllConversations());
  }

  Stream<List<Conversation>> watchConversations() => _convController.stream;

  Future<List<Message>> getMessagesForConversation(String convId, {int limit = 50, int offset = 0}) async {
    final list = _messages.values.where((m) => m.conversationId == convId).toList()
      ..sort((a, b) => b.sequenceNumber.compareTo(a.sequenceNumber));
    return list.skip(offset).take(limit).toList().reversed.toList();
  }

  Stream<List<Message>> watchMessages(String convId) {
    _msgControllers.putIfAbsent(convId, () => StreamController<List<Message>>.broadcast());
    Future.microtask(() async {
      _msgControllers[convId]!.add(await getMessagesForConversation(convId, limit: 1000));
    });
    return _msgControllers[convId]!.stream;
  }

  Future<void> upsertMessage(MessagesCompanion msg) async {
    _messages[msg.id.value] = Message(
      id: msg.id.value,
      clientMessageId: msg.clientMessageId.value,
      conversationId: msg.conversationId.value,
      senderId: msg.senderId.value,
      senderName: msg.senderName.present ? msg.senderName.value : _messages[msg.id.value]?.senderName,
      body: msg.body.present ? msg.body.value : _messages[msg.id.value]?.body,
      type: msg.type.present ? msg.type.value! : _messages[msg.id.value]?.type ?? 'TEXT',
      sequenceNumber: msg.sequenceNumber.value,
      replyToId: msg.replyToId.present ? msg.replyToId.value : _messages[msg.id.value]?.replyToId,
      isEdited: msg.isEdited.present ? msg.isEdited.value! : _messages[msg.id.value]?.isEdited ?? false,
      isForwarded: msg.isForwarded.present ? msg.isForwarded.value! : _messages[msg.id.value]?.isForwarded ?? false,
      isDeletedForEveryone: msg.isDeletedForEveryone.present ? msg.isDeletedForEveryone.value! : _messages[msg.id.value]?.isDeletedForEveryone ?? false,
      status: msg.status.present ? msg.status.value! : _messages[msg.id.value]?.status ?? 'SENT',
      createdAt: msg.createdAt.value,
      updatedAt: msg.updatedAt.present ? msg.updatedAt.value : _messages[msg.id.value]?.updatedAt,
    );
    final convId = msg.conversationId.value;
    if (_msgControllers.containsKey(convId)) {
      _msgControllers[convId]!.add(await getMessagesForConversation(convId, limit: 1000));
    }
  }

  Future<void> deleteMessage(String id) async {
    final msg = _messages[id];
    if (msg != null) {
      _messages.remove(id);
      final convId = msg.conversationId;
      if (_msgControllers.containsKey(convId)) {
        _msgControllers[convId]!.add(await getMessagesForConversation(convId, limit: 1000));
      }
    }
  }

  Future<void> enqueue(QueuedMessagesCompanion q) async {
    _queued[q.clientMessageId.value] = QueuedMessage(
      clientMessageId: q.clientMessageId.value,
      conversationId: q.conversationId.value,
      body: q.body.present ? q.body.value : _queued[q.clientMessageId.value]?.body,
      type: q.type.present ? q.type.value! : _queued[q.clientMessageId.value]?.type ?? 'TEXT',
      createdAt: q.createdAt.present ? q.createdAt.value! : DateTime.now(),
      retryCount: q.retryCount.present ? q.retryCount.value! : _queued[q.clientMessageId.value]?.retryCount ?? 0,
    );
  }

  Future<List<QueuedMessage>> getQueued() async => _queued.values.toList();
  Future<void> dequeue(String clientId) async => _queued.remove(clientId);

  Future<void> saveDraft(String convId, String text) async {
    _drafts[convId] = Draft(conversationId: convId, text: text, updatedAt: DateTime.now());
  }

  Future<Draft?> getDraft(String convId) async => _drafts[convId];
}
