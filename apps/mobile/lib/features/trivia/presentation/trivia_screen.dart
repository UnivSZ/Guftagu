import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/app_colors.dart';

class TriviaScreen extends StatefulWidget {
  final String conversationId;
  final String sessionId;
  const TriviaScreen({super.key, required this.conversationId, required this.sessionId});
  @override
  State<TriviaScreen> createState() => _TriviaScreenState();
}

class _TriviaScreenState extends State<TriviaScreen> {
  dynamic _data;
  bool _loading = true;
  int? _selectedIndex;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final res = await ApiClient.dio.get('/trivia/${widget.sessionId}');
      setState(() { _data = res.data; _loading = false; _selectedIndex = null; });
    } catch (e) { setState(() => _loading = false); }
  }

  Future<void> _answer(String questionId, int idx) async {
    setState(() => _selectedIndex = idx);
    try {
      await ApiClient.dio.post('/trivia/${widget.sessionId}/answer', data: {'questionId': questionId, 'selectedIndex': idx});
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Answer submitted')));
    } catch (e) { ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error $e'))); }
  }

  Future<void> _advance() async {
    try { await ApiClient.dio.post('/trivia/${widget.sessionId}/advance'); _load(); } catch (e) { ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error $e'))); }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return Scaffold(appBar: AppBar(title: const Text('Trivia')), body: const Center(child: CircularProgressIndicator()));
    final session = _data['session'];
    final questions = _data['questions'] as List? ?? [];
    final currentIdx = session['currentQuestionIndex'] ?? 0;
    final state = session['state'];
    final currentQ = questions.isNotEmpty && currentIdx < questions.length ? questions[currentIdx] : null;

    return Scaffold(
      appBar: AppBar(title: Text('Trivia - $state')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            LinearProgressIndicator(value: questions.isEmpty ? 0 : (currentIdx+1)/questions.length, color: AppColors.primary),
            const SizedBox(height: 16),
            if (currentQ != null) ...[
              Text(currentQ['question'], style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
              const SizedBox(height: 16),
              ...List.generate((currentQ['options'] as List).length, (i) {
                final opt = currentQ['options'][i];
                final isSelected = _selectedIndex == i;
                return Card(
                  color: isSelected ? AppColors.primaryContainer : null,
                  child: ListTile(
                    title: Text(opt),
                    trailing: isSelected ? const Icon(Icons.check_circle, color: AppColors.primary) : null,
                    onTap: state == 'QUESTION' ? () => _answer(currentQ['id'], i) : null,
                  ),
                );
              }),
              if (currentQ.containsKey('correctIndex')) Padding(padding: const EdgeInsets.only(top: 12), child: Text('Correct: ${currentQ['options'][currentQ['correctIndex']]}', style: const TextStyle(color: AppColors.success, fontWeight: FontWeight.w600))),
            ] else Text('No question. State: $state'),
            const Spacer(),
            Row(children: [
              ElevatedButton(onPressed: _advance, child: Text(state == 'LOBBY' ? 'Start' : state == 'QUESTION' ? 'Reveal' : 'Next')),
              const SizedBox(width: 12),
              OutlinedButton(onPressed: () async {
                final res = await ApiClient.dio.get('/trivia/${widget.sessionId}/leaderboard');
                if (context.mounted) showDialog(context: context, builder: (c) => AlertDialog(title: const Text('Leaderboard'), content: Column(mainAxisSize: MainAxisSize.min, children: (res.data as List).map((p) => ListTile(title: Text(p['user']?['displayName'] ?? p['userId']), trailing: Text('${p['score']} pts'))).toList())));
              }, child: const Text('Leaderboard')),
            ]),
          ],
        ),
      ),
    );
  }
}
