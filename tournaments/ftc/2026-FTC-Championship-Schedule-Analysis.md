---
layout: page
title: "2026 FTC Championship — Schedule Favorability Analysis"
---

# 2026 FTC Championship — Schedule Favorability Analysis

**Adventist Robotics League Championship · April 12, 2026**

This analysis uses OPR (Offensive Power Rating) to measure how favorable or unfavorable each team's qualification schedule was. OPR estimates each team's individual contribution to their alliance's score based on all qualification match results.

**Schedule favorability** measures the per-match advantage or disadvantage from random schedule assignment:

> **Favorability = Partner OPR − (Opponent 1 OPR + Opponent 2 OPR)**

A higher (less negative) value means a team had stronger partners and/or weaker opponents on average. Since each team faces 2 opponents but only has 1 partner, nearly all values are negative — what matters is the *relative* difference between teams.

**Expected Wins** predicts how many matches a team "should" win based on comparing alliance OPRs. **Luck** is the difference between actual wins and expected wins.

| Team | OPR | Rank | W-L | Avg Favorability | Expected Wins | Actual Wins | Luck |
| ---- | --- | ---- | --- | ---------------- | ------------- | ----------- | ---- |
| 21993 Tech Titans | 44 | 1 | 5-0 | +3.4 | 5.0 | 5 | 0.0 |
| 24813 SHCA Happy Hawks | 101 | 2 | 4-1 | −62.5 | 5.0 | 4 | −1.0 |
| 5198 Wingnuts | 58 | 3 | 3-2 | −56.6 | 3.0 | 3 | 0.0 |
| 24480 JagTech | 80 | 4 | 4-1 | −62.5 | 3.0 | 4 | +1.0 |
| 27795 The Sentinels | 72 | 5 | 4-1 | −29.5 | 6.0 | 4 | −2.0 |
| 32314 Marcus Bartholomew the Third Senior | 60 | 6 | 3-2 | −53.7 | 2.0 | 3 | +1.0 |
| 32350 CODEIAKS | 54 | 7 | 3-2 | −37.3 | 3.0 | 3 | 0.0 |
| 19712 NDAASentinels | 30 | 8 | 3-2 | −19.9 | 3.0 | 3 | 0.0 |
| 18783 Eagle Tech | 28 | 9 | 3-2 | −17.9 | 3.0 | 3 | 0.0 |
| 32453 TIGERBOTICS | 22 | 10 | 3-2 | −21.7 | 3.0 | 3 | 0.0 |
| 28228 Mountaingears | 30 | 11 | 3-2 | −32.6 | 2.0 | 3 | +1.0 |
| 8990 Mile High Academy Mustangs | 33 | 12 | 3-2 | −27.3 | 3.0 | 3 | 0.0 |
| 16899 CPUsaders_T | 46 | 13 | 3-2 | −51.2 | 3.0 | 3 | 0.0 |
| 31907 Wisconsin Academy | 42 | 14 | 2-3 | −45.7 | 3.0 | 2 | −1.0 |
| 13153 Marvin's Minions | 12 | 15 | 2-3 | −24.5 | 2.0 | 2 | 0.0 |
| 31620 Titanium Talons (Collegedale Academy) | 30 | 16 | 2-3 | −59.1 | 1.0 | 2 | +1.0 |
| 23958 Wait4iT | 29 | 17 | 1-4 | −51.0 | 2.0 | 1 | −1.0 |
| 30646 Apocalypse Neo Gen | 33 | 18 | 1-4 | −61.6 | 0.0 | 1 | +1.0 |
| 11020 Gearhead Gladiators | 11 | 19 | 0-5 | −52.4 | 0.0 | 0 | 0.0 |
| 20840 The Senjus of Raleigh | 16 | 20 | 0-5 | −40.7 | 1.0 | 0 | −1.0 |
| 26646 Stallion Robotics | 24 | 21 | 1-4 | −50.2 | 1.0 | 1 | 0.0 |

## Key Takeaways

**Tech Titans** (ranked 1st, 5-0) had the only positive schedule favorability (+3.4) — meaning their average partner was stronger than their combined opponents. Their OPR of 44 was only 7th-best, but the favorable schedule carried them to a perfect record.

**Happy Hawks** (OPR 101, by far the highest) and **JagTech** (OPR 80, 2nd-highest) had the hardest schedules (−62.5), tied for last. Despite being the two strongest teams, they were randomly assigned the weakest partners on average.

**The Sentinels** (OPR 72, 3rd-highest) were the unluckiest team — they expected 6 wins based on OPR but only got 4. Combined with a moderate schedule, they ranked 5th despite being one of the strongest teams.

The MatchMaker scheduling algorithm is strength-blind — it optimizes for pairing diversity and match separation, not competitive balance. These favorability differences are purely random, which is why OPR is a better predictor of playoff performance than qualification rankings.

---

[← Back to tournament results](/tournaments/ftc/2026-Adventist-Robotics-League-Championship-FTC)
