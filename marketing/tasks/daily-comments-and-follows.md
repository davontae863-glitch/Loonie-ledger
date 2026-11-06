# Scheduled task to create: "Loonie Ledger daily comments + follow ideas"

Daily at 10:47 AM America/Edmonton. Couldn't be created from the 2026-11-05 session (scheduled-task changes were blocked there); ask Claude in a normal chat to create it from this file.

What it does each day:
1. Reads new comments on @loonieledgerofficial (Windsor.ai, connector "instagram", account 17841416800477802).
   - Replies automatically only to simple friendly comments (quiz scores, thanks, compliments, emojis) — one warm sentence, no links, no selling.
   - Anything else (questions about someone's taxes, advice requests, complaints, criticism, unsure) → a suggested reply sent to the owner for approval. Never tax advice; never hide/delete comments.
   - Logs every comment in marketing/comments-log.md.
2. Suggests 3–5 new accounts per platform (Instagram, TikTok, YouTube, Facebook, Pinterest) not already in marketing/follow-suggestions.md, only accounts named by reputable sources (MoneySense, money.ca, CPA Canada, CBC, Globe and Mail, official org sites), and appends them there.
3. Commits and pushes both files.
4. Sends one daily notification: replies done, replies needing approval (with suggested text), and today's follows by platform.
Never follows, likes or comments on other accounts, never posts new content, never spends money.
