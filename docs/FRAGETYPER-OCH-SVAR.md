# Frågetyper och svarslogik

> **Detta dokument ska hållas uppdaterat.** Så fort en frågetyp, `answer_config`-inställning,
> `grading_mode` eller rättningslogik ändras eller läggs till (i `backend/utils/grading/`,
> `shared/grading/`, `frontend/src/utils/grading/`, `frontend/src/constants/assessmentConstants.js`
> eller `AssessmentEngine.evaluateAnswer`) — uppdatera motsvarande avsnitt här i samma commit.

## 1. Var logiken bor

| Lager | Fil(er) |
|---|---|
| Schema | `05_blocks.sql` (`questions.question_type` ENUM, `answer_config` JSON, `options`, `question_media`) |
| Frontend-konstanter | `frontend/src/constants/assessmentConstants.js` (`QUESTION_TYPES`, `GRADING_MODES`, `ANSWER_FORMATS`, `NUMERIC_INPUT_MARKER`) |
| Rättning (server, facit) | `backend/services/AssessmentEngine.js` → `evaluateAnswer()` väljer gren utifrån `question_type` |
| Rättningsfunktioner (backend) | `backend/utils/grading/gradeAnswer.js` (dispatcher) + `gradeText.js`, `gradeNumeric.js`, `gradeNumericInput.js`, `gradeFraction.js`, `gradeAlgebra.js`, `gradeVariables.js` |
| Rättningsfunktioner (frontend, live-feedback) | `frontend/src/utils/grading/*.js` — **speglar backend-filerna manuellt**, hålls INTE i sync automatiskt |
| Delad kod | `shared/grading/gradeText.js` (`normalizeAnswer`, `gradePlainText`, algebra-fallback) |
| Redigering av inställningar (lärare) | `frontend/src/components/ui/AnswerConfigEditor.jsx`, `QuestionCard.jsx`, `OptionList.jsx` |
| Elevens svarsformulär | `frontend/src/App/Dashboard/StudentDashboard/Main/NumericInputQuestion.jsx`, `QuestionView.jsx` |
| Importlogik (Excel → frågor) | `backend/helpers/normalizeImportRows.js`, `backend/helpers/importQuestionsToBlock.js` |
| Valideringsvarningar i UI | `frontend/src/utils/getQuestionIssues.js` |

⚠️ Backend har ingen volymmontering — efter ändringar i `backend/`, kör
`docker compose build backend && docker compose up -d backend`.

---

## 2. `question_type` (ENUM på `questions`)

| Värde | Label (UI) | Facit lagras i | Rättas via |
|---|---|---|---|
| `single_choice` | Enval | `options` (exakt 1 rad `is_correct=1`) | jämförelse av valda `option_id` mot korrekta id:n |
| `multiple_choice` | Flerval | `options` (≥1 rad `is_correct=1`) | jämförelse av **hela mängden** valda `option_id` mot korrekta id:n (alla-eller-inget) |
| `text` | Ren text | `options` (1 rad `is_correct=1`, `text` = facit) + ev. `answer_config` | `gradeAnswer()` → styrs av `answer_config.grading_mode` (se §4) |
| `expression` | Uttryckssvar | `options` (1 rad `is_correct=1`) | alltid `gradeText()` (normaliserad textjämförelse + algebra-fallback), oavsett `grading_mode` |
| `numeric_input` | Numerisk(a) svarsruta(or) | `options` (en rad per svarsruta, `is_correct=1`, ordnade efter `id`) | `gradeNumericInput` / `scoreNumericInput` (se §5) |
| `equation` | Ekvation (valfritt antal svar) | `options` (en rad per rot/lösning, `is_correct=1`) | samma som `numeric_input`, men **alltid** `order_independent = true` och antal svarsrutor = antal korrekta alternativ (inga `{{input}}`-markörer krävs i texten) |
| `linear_system` | Linjärt ekvationssystem | `answer_config.variables` med namngivna svar (`x`, `y` osv.) | variabelbunden numerisk rättning med validering av distinkta värden |
| `factorization` | Faktorisering | `options` (1 rad `is_correct=1`) | algebraisk ekvivalens + kontroll av faktorstruktur; fullt faktoriserat ger 1 poäng, delvis faktoriserat 0,5 poäng |

`linear_system` är en separat frågetyp för linjära ekvationssystem. Den ska inte behandlas som
en variant av `numeric_input`, eftersom varje svar kopplas till en namngiven variabel (`x`, `y`)
och systemet kan kräva att variablerna har olika värden.

Frågor av typ `single_choice`/`multiple_choice` rättas i `AssessmentEngine.evaluateAnswer`s
`else`-gren (jämför `JSON.stringify` av sorterade id-listor) — de går **inte** via `gradeAnswer.js`.

---

## 3. Choice-frågor (`single_choice` / `multiple_choice`)

- Alternativ läggs i `options` via `OptionList.jsx`, en rad per alternativ (`sort_order`, `text`, `is_correct`).
- `single_choice` **måste** ha exakt ett korrekt alternativ (kontrolleras av import-validering och `getQuestionIssues.js`).
- `multiple_choice` måste ha minst ett korrekt alternativ.
- **Alla alternativ (rätt + distraktorer) måste vara unika, både i visningssträng OCH i matematiskt
  värde** (t.ex. `2/4` och `1/2` räknas som samma värde — reducera bråk innan jämförelse). Se
  `/memories/repo/question-import-process.md` för verifieringsrutin vid Excel-import.
- Text/alternativ som innehåller LaTeX-matte wrappas i `$...$` (rena heltal behöver inte det).

---

## 4. `text` / `expression` — `answer_config.grading_mode`

`gradeAnswer({ studentAnswer, correctAnswer, questionType, config })`:

```
mode = questionType === "expression" ? "expression" : (config.grading_mode || "text")
```

D.v.s. **`expression`-frågor ignorerar alltid `grading_mode`** och rättas som fritt
LaTeX-uttryck. `text`-frågor väljer läge själva via `grading_mode`:

| `grading_mode` | Funktion | Beteende | Relevanta `answer_config`-fält |
|---|---|---|---|
| `text` (default) | `gradePlainText` | Exakt strängjämförelse efter `trim()` | `default_answer` |
| `expression` | `gradeText` | Normaliserar (gemener, tar bort `$`, mellanslag, `.`, ev. `,`), sedan algebra-fallback (`gradeAlgebra`, se nedan) om strängarna inte matchar exakt | `default_answer` |
| `numeric` | `gradeNumeric` | Talvärde-jämförelse, se §6 | `default_answer`, `decimals`, `tolerance`, `round_to`, `answer_format` |
| `fraction` | `gradeFraction` | Bråkjämförelse, se §6 | `default_answer`, `require_simplified`, `allow_decimal`, `answer_format` |
| `algebra` | `gradeAlgebra` | `mathjs.simplify(student - correct) === "0"` (LaTeX `\frac{}{}` konverteras till `(a)/(b)` först) | `default_answer` |
| `variables` | `gradeVariables` | Parsar `"x=1, y=2"`-listor till namn/värde-par och jämför som karta (eller som osorterad mängd av värden om `ignore_variable_names`) | `default_answer`, `ignore_variable_names` |

`gradeAlgebra` används även som fallback inuti `gradeText`/`expression`-läget, så ett uttryck som
`2x+2` godkänns mot facit `2(x+1)` även om strängarna skiljer sig.

---

## 5. `numeric_input` / `equation`

- Frågetexten placerar en svarsruta med markören `{{input}}` (konstant `NUMERIC_INPUT_MARKER`),
  t.ex. `x = {{input}}` eller flera för ekvationssystem: `x = {{input}} och y = {{input}}`.
  **`equation`-typen kräver INGA markörer** — antalet rutor bestäms istället av antalet korrekta
  `options`-rader (minst 1).
- Facit = en `options`-rad per svarsruta, `is_correct=1`, ordnad efter `id` (samma ordning som
  markörerna i texten för `numeric_input`).
- Elevens svar lagras som JSON-array-sträng i `assessment_answers.text_answer`, t.ex. `["3.5","-2"]`.
- Rättning i `backend/utils/grading/gradeNumericInput.js`:
  - **Standard (positionsbaserad)**: svar `i` måste matcha facit `i` (via `compareNumeric`, se §6).
    Alla rutor måste vara rätt (allt-eller-inget).
  - **`answer_config.order_independent = true`** (alltid `true` för `equation`, valbart kryssruta
    "Ordning spelar ingen roll" för `numeric_input`): facit och svar jämförs som mängder istället
    för position — bra för ekvationer där en dubbelrot bara behöver anges en gång, eller där
    x/y-ordningen inte spelar roll.
  - `scoreNumericInput()` ger även delpoäng: `pointsFraction = korrekta rutor / totalt antal rutor`,
    samt en `masteryMultiplier` för adaptiv förmågeuppdatering (hela frågan rätt = `1`, annars
    linjärt/hårdare skalad ner mot `-1`; endräkning med bara 1 ruta har inget delkoncept, ren ±1).
  - `getFieldMatches()` avgör vilka enskilda rutor som ska markeras gröna i UI (positionellt eller
    "girigt" mängd-matchat vid `order_independent`).
- Bulk-verktyg: `BlockContent.jsx` → "Operationer" → "Är ekvationer" sätter
  `question_type=numeric_input`, lägger till saknade `{{input}}`-rader (en per rätt alternativ) och
  `answer_config.order_independent=true` för hela block i ett svep. Kontrollera alltid att antal
  markörer i texten matchar antal `options`-rader efteråt (`getQuestionIssues.js` varnar annars).

### 5.1 `linear_system`

Ett linjärt ekvationssystem har en egen frågetyp med namngivna svar, i stället för två
onyanserade numeriska `options`-rader. `answer_config` ser exempelvis ut så här:

```json
{
  "variables": [
    { "name": "x", "answer": "-9" },
    { "name": "y", "answer": "-5" }
  ],
  "require_distinct_values": true
}
```

Rättningen jämför varje elevsvar med rätt variabel. Vid `require_distinct_values: true` avvisar
facitvalideringen system där två
variabler har samma värde; en sådan fråga behöver ändras matematiskt innan den publiceras.

Vid migrering från befintliga system som låg som `numeric_input` används ordningen i frågetexten
(`x = {{input}}` och `y = {{input}}`) för att namnge de befintliga svaren. Migrering sker bara
efter oberoende kontroll av att varje lösning hör till rätt variabel.

### 5.2 `factorization`

`factorization` använder ett vanligt textsvar, men rättas i tre steg:

1. Elevsvaret måste vara algebraiskt ekvivalent med facit.
2. Ett ekvivalent men ofaktoriserat svar ger 0 poäng.
3. En påbörjad faktorisering med en fortfarande reducerbar faktor ger 0,5 poäng. Ett uttryck där
  alla faktorer är irreducibla inom det stödda området ger 1 poäng.

Exempel för $x^3-11x^2$:

| Elevsvar | Poängandel |
|---|---:|
| `x^2(x-11)` | 1 |
| `(x-11)x^2` | 1 |
| `x(x^2-11x)` | 0,5 |
| `x^3-11x^2` | 0 |

Automatisk faktorisering och strukturkontroll stöder för närvarande envariabelpolynom med
heltalskoefficienter: gemensam numerisk/monomial faktor samt linjära faktorer med heltalsrötter.
Facit skrivs med implicit multiplikation mellan koefficient och variabel, exempelvis `11x^2`,
aldrig `11*x^2`.

---

## 6. Delade jämförelsefunktioner

### `compareNumeric` / `parseNumericAnswer` (`gradeNumeric.js`)
- Accepterar både `,` och `.` som decimaltecken.
- Känner igen `x = 3` och plockar ut `3`.
- Prioritetsordning för hur "lika" avgörs (första matchande vinner): `tolerance` (absolut
  differens) → `round_to` (avrundar båda till närmaste multipel) → `decimals` (jämför
  `toFixed(n)`) → annars exakt `===`.
- **Frontend-versionen** (`frontend/src/utils/grading/gradeNumeric.js`) kan även tolka `%` och
  LaTeX/`a/b`-bråk som tal, och kollar `answer_format` (se nedan) INNAN den jämför. **Backend-
  versionen gör i dagsläget INTE detta** — se känd begränsning i §8.

### `answer_format` (`all` | `decimal` | `percent` | `fraction`)
Styr vilket format elevens inmatning måste ha för att ens prövas (regex-kontroll), t.ex.
`fraction` kräver `a/b`. Fältet "Svar ska anges som" i `AnswerConfigEditor.jsx` visas för
`numeric_input`/`equation` samt `grading_mode` `numeric`/`fraction`.

### `gradeFraction`
- Kräver formatet `heltal/heltal` (whitespace tillåtet) om inte `allow_decimal`.
- `allow_decimal`: tillåter att eleven svarar med ett decimaltal, jämförs mot bråkets exakta värde.
- `require_simplified`: kräver att elevens bråk är i lägsta termer (`gcd(täljare, nämnare) === 1`).

### `gradeAlgebra`
- Konverterar LaTeX `\frac{a}{b}` → `(a)/(b)` rekursivt (hanterar nästlade brace-grupper), skickar
  `(student) - (facit)` till `mathjs.simplify()` och kräver att resultatet är `"0"`.

### `gradeVariables`
- Delar upp på `,`, varje del på `=` → `{name, value}`. `ignore_variable_names` jämför bara den
  sorterade listan av värden (inte vilket variabelnamn som hör till vilket).

---

## 7. Media, behörigheter och övriga flaggor på `questions`

| Kolumn | Betydelse |
|---|---|
| `question_media` (tabell) | Bild/video kopplad till frågan (`media_type`: `image`/`video`, `media_url`, `sort_order`). Vid Excel-import: kolumn `Bild (URL)` måste peka på en redan nåbar URL (t.ex. `/uploads/...`), inte en lokal fil. |
| `calculator_allowed` | Om miniräknare får användas på just denna fråga |
| `geogebra_allowed` | Om GeoGebra får användas / GeoGebra-konstruktion kopplad |
| `excluded_from_assessments` | Frågan exkluderas från (vissa) bedömningar/diagnoser trots att den ligger i blocket |
| `series_level_id` | Vilken nivå i förmågeserien frågan tillhör — **måste** sättas (kräver att blockets `block_abilities` finns innan import, annars blir alla frågor `NULL` och osynliga för adaptiv diagnos) |
| `level_id` | Äldre nivå-referens (`question_levels`) — annan tabell än `series_level_id`, blanda inte ihop dem vid PUT-anrop |
| `group_question_priorities` / `block_question_priorities` | Prioriterade frågor visas först för en grupp/block innan resten av frågepoolen används |

---

## 8. Kända begränsningar / fallgropar

- **`answer_format` enforcas bara i frontendens live-rättning**, inte i backendens
  `gradeNumeric.js`/`gradeFraction.js` (backend saknar `isAnswerFormatAllowed`-kontrollen som
  frontend-kopian har). Facit-rättningen på servern är alltså mer tillåtande än vad eleven ser i
  UI:t just nu — håll i minnet vid felsökning av "varför godkändes X-formatet fast det inte skulle".
- Frontend- och backend-rättningsfilerna i `grading/`-mapparna är **manuellt speglade**, inte
  delade moduler (utom `shared/grading/gradeText.js`). Ändra båda vid behov.
- `numeric_input` kräver att antal `{{input}}`-markörer i texten == antal korrekta `options`-rader;
  `equation` bryr sig inte om markörer alls, bara om antal korrekta `options`.
- Se `/memories/repo/question-import-process.md` för importspecifika regler (LaTeX-formatering,
  dedupe av alternativ, obligatorisk oberoende verifiering av facit före import) och
  `/memories/repo/database-schema-fixes.md` för historik kring dessa frågetypers tillkomst.

---

## 9. Checklista vid skapande av en ny fråga

1. Välj `question_type` utifrån svarsformen (se tabellen i §2).
2. Choice-frågor: lägg alternativ i rätt ordning, exakt/minst ett `is_correct`, kontrollera unika
   värden (inte bara unika strängar).
3. `text`/`expression`: lägg en `options`-rad med facit; välj `grading_mode` om typen är `text`
   (annars ignoreras `grading_mode` för `expression`).
4. `numeric_input`: lägg `{{input}}` en gång per svarsruta i texten, en `options`-rad per ruta i
   samma ordning; sätt `order_independent` om ordningen inte spelar roll.
5. `equation`: lägg en `options`-rad per lösning, ingen markör behövs.
6. Sätt `series_level_id` (kräver att blockets förmåga redan är kopplad).
7. Sätt `calculator_allowed`/`geogebra_allowed`/`excluded_from_assessments` vid behov.
8. Kör/kontrollera `getQuestionIssues.js`-varningarna (eller motsvarande UI) innan publicering.
9. Verifiera facit oberoende (räkna om för hand/skript) — lita aldrig blint på källdata.
