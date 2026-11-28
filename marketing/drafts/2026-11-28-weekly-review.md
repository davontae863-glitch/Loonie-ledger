# Weekly review — 2026-11-28 (calendar day 28)

No pin or video today (weekly review day). About 10 minutes: open the `/owner` dashboard → **Link clicks** section (last 30 days, one row per campaign + target page, most clicks first), plus Instagram/Facebook insights and the Buffer stats for Pinterest, TikTok and YouTube.

This week (11-21 to 11-27, days 21–27): "Canadian money mistake" #15–#19 plus "Tax-season prep" #4–#7. Links went mostly to the **Bookkeeping Tracker** (11-21, 24, 25, 27), plus the **free GST checker** (11-22, 26) and the **Invoice Generator** (11-23). **No Room Tracker, Household Budget or Bundle posts this week.** Reels: voiced 11-22, 24, 26 vs music-only 11-21, 23, 25, 27. Green 11-22, 23, 24 vs white 11-21, 25, 26, 27.

Comments: `comments-log.md` shows **one** comment in 28 days (11-23, from the account `eltwo.ai`, on mistake #3). It reads like another brand's promo account, not a customer, so don't count it as real engagement yet. Since then there have been 0 new comments.

## 1. Compare in the dashboard clicks section

Write the number next to each row. "0 / not in the list" is a useful answer too.

**Facebook posts (midday photo + evening Reel image)**
- [ ] 11-21: `fb-post-claim-itcs-1121` · `fb-vid-what-is-t2125-21` → Bookkeeping Tracker
- [ ] 11-22: `fb-vid-platform-reports-22` → /gst-threshold-checker/ (no midday row logged)
- [ ] 11-23: `fb-post-invoice-numbering-23` · `fb-vid-invoice-numbering-23` → Invoice Generator
- [ ] 11-24: `fb-post-year-end-summary-24` · `fb-vid-year-end-summary-24` → Bookkeeping Tracker
- [ ] 11-25: `fb-post-gst-held-in-trust-25` · `fb-vid-gst-held-in-trust-25` → Bookkeeping Tracker
- [ ] 11-26: `fb-post-gst-checker-26` · `fb-vid-gst-checker-26` → /gst-threshold-checker/
- [ ] 11-27: `fb-post-receipt-photos-27` · `fb-vid-receipt-photos-27` → Bookkeeping Tracker
- [ ] Midday (`fb-post-…`) vs evening (`fb-vid-…`): is the winner the same as in the last two weeks?

**Videos (TikTok / Shorts links, which only show up if you posted them)**
- [ ] `vid-platform-reports-22`, `vid-invoice-numbering-23`, `vid-year-end-summary-24`, `vid-gst-held-in-trust-25`, `vid-gst-checker-26`, `vid-receipt-photos-27`

**Instagram (bio link)**
- [ ] `bio-ig` this week vs the last two weeks, and Linktree button clicks (checker vs Bookkeeping Tracker vs "all tools").

**Pins** link straight to Payhip, so they **won't appear here**. Check Pinterest outbound clicks and Payhip page views:
- [ ] Bookkeeping Tracker `vH7YQ` (pins 11-22, 24, 25, 26, 27) · Invoice Generator `blIrn` (11-23)

**Then work out:**
- [ ] Best and worst campaign this week.
- [ ] The two checker days (11-22, 11-26) vs the product days: do the free checker's links still get the most clicks?
- [ ] Did the one Invoice Generator day (11-23) get any clicks? It's the first one since 11-12.
- [ ] Any row you don't recognise (a typo or a test link)?

## 2. Compare on the platforms

- [ ] Instagram Reels: 3-second skip rate and average watch time per Reel. Which hook held viewers longest?
  - "Side hustle? This form is yours." (11-21, "you") · "Selling online? The platform tells CRA." (11-22, surprise) · "Stop numbering invoices 1, 2, 3." (11-23, mistake) · "Self-employed? Your year ends in 37 days." (11-24, number) · "That $1,300 HST? Not your money." (11-25, number + surprise) · "Do you charge GST? Type 4 numbers." (11-26, question + number) · "Snapped the receipt? Don't toss it yet." (11-27, mistake)
- [ ] Question-led hooks ("Selling online?", "Self-employed?", "Do you charge GST?", "Snapped the receipt?") were the main style this week. Did they hold better or worse than the bare-statement hooks ("Stop numbering…", "That $1,300 HST…")?
- [ ] Voiced vs music-only, and green vs white: three weeks of data now. If there's still no clear gap, I'd suggest keeping both random and dropping this question from the reviews.
- [ ] Carousels: saves and shares for each. Did "That $1,300 HST? Not your money." (11-25) or the receipt one (11-27) get saved more than the others?
- [ ] Followers on each platform vs last week, and profile visits from Reels.
- [ ] Reach: Reels insights → "Accounts reached", followers vs non-followers. If nearly everyone reached is already a follower, the hooks aren't the bottleneck; it's distribution.
- [ ] Pinterest impressions and saves per pin; TikTok/YouTube views and watch time.

## 3. Housekeeping from `posted.md`

- [ ] **Midday post missing on 11-20 and 11-22.** There's no carousel or Facebook photo row for either day. Were they skipped, or posted but not logged? This is the second week with gaps, so the midday scheduled task may need a look.
- [ ] **Windsor.ai "Application request limit reached"** showed up on every midday post this week (11-21, 23, 24, 25, 26, 27). Each one published anyway and was checked, not retried, but it's now a daily warning. Please check your Windsor plan's limits page.
- [ ] **WebFetch was unavailable** on 11-24, 25 and 26 (midday) and 11-26 (evening). Those runs checked facts against canada.ca search results instead of opening the page. That's allowed, but less thorough, so it's worth knowing about.
- [ ] Is the **11-15 duplicate carousel** `18126244430317502` deleted? It was flagged in the last two reviews.

## 4. Questions for Davontae

1. Which posts went out on TikTok, YouTube and Pinterest this week? `posted.md` only has Instagram/Facebook rows, so I still can't tell "0 clicks" from "not posted". This is the fourth week asking; one line per post in `posted.md` would fix it.
2. Any sales or Payhip page views this week, and for which product?
3. **All-Access Membership:** `site/src/products.json` has a live "All-Access Membership" ($5/month, every tool plus January updates). It's not in the daily-draft prompt, the README pin links or the calendar, so it has never been promoted. Should posts include it? If yes, which Payhip link should pins use?
4. **Calendar after day 30:** the plan runs out on 11-30. Unless you say otherwise, from day 31 I'll keep rotating all five products, the free checker (and the membership if you OK it) through the two series. I'll add each new day to `calendar.md` as it's written. Want a different focus for December? For example, more Room Tracker and Household Budget, since they've had very few posts.
5. Still open since 11-07 and 11-14: (a) start `marketing/experiments.md` for hook style, voiced vs music and green vs white? (b) update the calendar's top note, which still says three products are "coming soon" when all five are live. I'm holding both until you say.
6. Add direct Household Budget and Invoice Generator buttons to the Linktree? Posts send people to "link in bio" for both.

## 5. Next two days — check before they run

- **Day 29 (11-29) New year, "New limits and rates — where to check"** → Room Tracker. It's the first Room Tracker post since 11-18, which is good. Any 2027 numbers (the TFSA dollar limit, the RRSP dollar limit, CPP/EI rates) must be confirmed on canada.ca that morning. If CRA hasn't published one yet, the post says where to check, not a guessed number. Day-of-year 333 is odd → **music only**. Styles: pin **green**, video **white**, carousel **green**.
- **Day 30 (11-30) "Wave 2: New Room Tracker, Household Budget, Bundle"** is out of date, because all of them have been live for weeks, so a "new" launch post would be misleading. Suggested replacement: a **Complete Bundle** day ("4 tools, one price", with the real bundle contents and the $39 price from `products.json`, no "save $X" claim) or a Household Budget day (only 11-19 so far). Day-of-year 334 is even → **voiced**. Styles: pin **green**, video **green**, carousel **green**.
- Series counters to continue from: mistake **#19** (11-27 evening), Tax-season prep **#7** (11-26).
- Hooks already used, so don't repeat them: the $30,000 rule (days 1, 2, 9, 16, 26), keep-records-until-2031 (11-13), receipt photos (11-27), mixing money (11-14).

No tax or government facts in this checklist, so no sources needed today.
