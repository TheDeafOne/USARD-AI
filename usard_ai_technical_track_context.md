# USARD AI Technical Track - Full Context and Notebook Build Brief

## Purpose of this document

This document is intended to be pasted into a new chat with an agent that will build the Jupyter notebooks for the USARD AI technical track. It captures the important context, decisions, constraints, story, lab structure, data design, and algorithm choices developed in the planning conversation.

The agent should treat this document as the working specification for the notebooks unless later instructions override it.

---

# 1. Instructor and course context

**Instructor:** Caleb Frey  
**Role:** AI instructor for the technical track of a U.S. Army Recruiting Division (USARD) AI workshop.  
**Course dates:** August 18-20, 2026.  
**Caleb is responsible for the Day 2 and Day 3 technical-track content, with Keegan Woodburn also listed as a technical-track instructor in the course guide.**

The overall technical-track structure that needs to be supported is:

1. **Data pipeline and integrity**
2. **Recommender systems**
3. **Generative AI + RAG**
4. **Agentic AI + validation**

The course is intended to help USARD personnel understand and apply AI to recruiting modernization, with emphasis on operational efficiency, decision-making, applicant engagement, workflow automation, data-driven recruiting strategies, responsible AI, and practical hands-on experience.

The audience is not uniformly technical. According to the BG Dudley meeting notes, participants include people doing or overseeing the actual work, with a mix of skeptics, people with limited AI skill, and people who are excited about using AI. The goal is to move them outside their current comfort zone without turning the course into an overly academic machine-learning class.

A key philosophy from the planning discussion is:

> The notebooks should be educational, concrete, and operationally motivated. Students should understand why each algorithm exists and how the pieces fit together, not merely run a complicated model.

The course itself is described as **education rather than job-specific training**. Participants should learn how to think about these problems and gain enough skill to take the concepts forward with their own data.

---

# 2. Relevant course outcomes

The official course guide emphasizes that participants should be able to:

- Define key AI terms and explain how AI, machine learning, generative AI, and agentic AI can support Army recruiting.
- Identify recruiting decisions and workflows that could benefit from AI, especially precision recruiting, recruiter productivity, pipeline visibility, and candidate engagement.
- Apply the **R.O.A.D. Framework**:
  - Requirements
  - Operationalize Data
  - Analytics/Algorithms
  - Deployment
- Evaluate performance measures and tradeoffs, including accuracy, precision, recall, false positives, false negatives, and the importance of clearly defined outcome labels.
- Assess data readiness, consistency, bias, security, and human-oversight requirements before developing or deploying an AI-enabled recruiting solution.
- Develop and present an actionable AI concept with an operational requirement, required data, analytic approach, deployment path, risks, and measures of success.

The notebook design should support those outcomes rather than functioning as an isolated coding exercise.

---

# 3. Day 2 and Day 3 schedule context

The technical-track schedule in the course guide is approximately:

## Day 2 - Technical

- 08:00-09:15 - Responsible AI
- 09:30-10:00 - Orientation & Pipeline Integrity Lab
- 10:00-11:00 - Hands-On: Pipeline Integrity Lab
- 11:15-11:30 - Recommender Systems
- 11:30-12:00 - Hands-On: Recommender Lab A
- 13:00-13:45 - Hands-On: Recommender Lab B
- 13:45-14:15 - Generative & Agentic AI, RAG
- 14:15-15:15 - Hands-On: RAG
- 15:30-16:15 - Hands-On: Agentic Integration
- 16:15-16:45 - Test, Evaluation, Red Team
- 16:45-17:00 - Daily Wrap-up

## Day 3 - Technical

- 08:00-08:30 - Executive-Technical Recap
- 08:30-09:45 - End-to-end Application with CODEX
- 10:00-12:00 - Capstone Lab
- 13:00-14:30 - Capstone Presentations
- 14:45-15:30 - LLM-as-a-Judge
- 15:30-16:00 - Course Wrap-up & Evaluation

This timing matters. The recommender labs need to be compact enough to fit a 30-minute Lab A and a 45-minute Lab B. The notebooks should be self-contained and should avoid unnecessary package friction or long training cycles.

---

# 4. What BG Dudley said is important

The planning should stay grounded in the meeting notes with BG Dudley.

Important themes from the meeting:

## 4.1 They already have enormous appointment volume

The notes state that roughly **11,000 staff start with about 700,000 appointments**, and many candidates subsequently drop out, do not show up, fail tests, or otherwise fall out of the pipeline.

This means the course story should **not** optimize for simply producing more appointments.

The better framing is:

> Use limited recruiter time and resources more precisely so that recruiting effort is more likely to produce successful downstream outcomes.

This was an important correction during planning. A model that simply ranks schools by number of appointments could be optimizing the wrong metric.

## 4.2 Pipeline integrity is a real issue

USARD uses Salesforce CRM, but the meeting notes describe it as having been patched or "band-aided" over time and becoming somewhat unreliable. The notes say they may not know where candidates are in the pipeline or even whether they have shipped.

This strongly supports a **Data Pipeline & Integrity** lab before recommender systems.

The story is:

> Precision recruiting depends on trustworthy historical recruiting data. AI cannot compensate for a broken or inconsistent pipeline.

## 4.3 Precision recruiting is the strategic theme

BG Dudley emphasized:

- identifying "low hanging fruit"
- matching the **right recruiter, right message, and right footprint**
- being more precise about areas with potential
- narrowing the aperture
- using AI to identify propensity in different regions for different jobs
- making the workforce more effective while losing funding, staff, and stations

She explicitly said that the more precise USARD can be about targeting areas with potential, the better, especially as stations are reduced.

She also suggested giving participants a task such as building an agent that can help determine where the probability of finding recruits is highest.

## 4.4 The course should help make the workforce more effective

The notes explicitly frame the goal as using AI to maximize effectiveness and precision in a future with constrained funding and personnel.

Therefore the central project story should be about **resource allocation and precision**, not generic personalization.

## 4.5 Responsible AI matters

The meeting also touched on bias and tailoring. The course should make a deliberate distinction between potentially useful operational variables and protected or sensitive characteristics.

For the classroom synthetic data, the preferred approach is to operate at the **school/market aggregate level**, use operationally interpretable features, and avoid using protected characteristics as ranking features.

Potential safe synthetic features include:

- historical recruiting outcomes
- school size
- school access
- travel distance
- career/technical programs
- outreach history
- recency
- data quality

Responsible-AI discussion can then ask:

> Just because a variable improves predictive performance, should it be used?

---

# 5. The cohesive course story

The strongest story developed in planning is a fictional **Precision Recruiting Assistant**.

The operational question is:

> **Given limited recruiter time and resources, where should recruiters focus, what should they do there, what should they know before engaging, and how do we know whether the AI recommendation should be trusted?**

The full technical workflow is:

```text
RAW RECRUITING DATA
        |
        v
1. CAN WE TRUST THE DATA?
        |
        v
Clean school + engagement + downstream outcome history
        |
        v
2. WHERE SHOULD WE FOCUS?
        |
        v
Rank schools by likely downstream value
        |
        v
3. WHAT SHOULD WE DO THERE?
        |
        v
Recommend an engagement/action for a selected school
        |
        v
4. WHAT SHOULD THE RECRUITER KNOW?
        |
        v
RAG creates an evidence-grounded engagement brief
        |
        v
5. HOW DO WE PUT IT ALL TOGETHER?
        |
        v
Agent orchestrates the workflow and possibly resource allocation
        |
        v
6. SHOULD WE TRUST THE RESULT?
        |
        v
Validation + red teaming + human review
```

A memorable question sequence is:

```text
CAN WE TRUST THE DATA?
        ->
WHERE SHOULD WE FOCUS?
        ->
WHAT SHOULD WE DO THERE?
        ->
WHAT SHOULD THE RECRUITER KNOW?
        ->
CAN WE TRUST THE RECOMMENDATION?
```

Agentic AI is then:

> Can the AI coordinate these capabilities into one workflow?

This gives Day 2 a coherent plot rather than a collection of unrelated AI topics.

---

# 6. Relationship to the supplied recommender-system slides

The supplied technical slides define a recommender system as an information-filtering tool that estimates which items are relevant to a user or decision context and returns a **ranked list**, not a simple yes/no prediction.

The slides' general recommendation workflow is:

1. Define the recommendation objective
2. Prepare and validate data
3. Represent users/items numerically
4. Calculate relevance or similarity
5. Exclude infeasible/prohibited options
6. Rank and return Top K

The slides cover:

- content-based filtering
- collaborative filtering
- matrix factorization / latent factors
- hybrid recommenders
- ranking evaluation such as Precision@K, Recall@K, and NDCG@K
- responsible deployment risks such as stale/duplicated data, exposure bias, correlation mistaken for causation, protected-characteristic influence, and automated action without human review

Our course story uses those ideas but adapts them to the recruiting context.

The recommended split is:

| Course problem | Technical description |
|---|---|
| Which schools appear promising? | Feature-based opportunity ranking / Top-K recommendation |
| What should we do at a school? | Collaborative filtering + content-based evidence -> hybrid recommender |
| What is the expected result? | Predictive / outcome modeling conceptually |
| Which engagements fit a fixed resource budget? | Constrained optimization, later in agentic or Day 3 work |
| What should the recruiter know? | RAG + generative AI |
| How are the pieces coordinated? | Agentic AI |
| Should we trust the system? | Evaluation, red teaming, human oversight |

Important pedagogical point:

> It is better to be technically honest than to force every problem into the label "collaborative filtering." Lab A is a ranking problem and Lab B is the more classic recommender-system problem.

---

# 7. Important modeling choice: optimize downstream success, not appointments

This is one of the most important ideas in the whole course story.

Example:

| School | Recruiter Hours | Appointments | Qualified | Contracts |
|---|---:|---:|---:|---:|
| Lincoln | 100 | 140 | 35 | 14 |
| Jefferson | 100 | 80 | 40 | 24 |
| Washington | 100 | 60 | 36 | 25 |

If ranked by appointments:

1. Lincoln
2. Jefferson
3. Washington

But contract efficiency is:

- Lincoln: 14 / 100 = 0.14 contracts per recruiter-hour
- Jefferson: 24 / 100 = 0.24
- Washington: 25 / 100 = 0.25

That changes the ranking completely.

This supports a core lesson:

> **A recommender can produce a perfectly correct ranking for the wrong objective.**

The notebook should explicitly create this "aha" moment.

The funnel should be visible in the synthetic data:

```text
Contacts
   ->
Appointments
   ->
Qualified Applicants
   ->
Contracts
   ->
Potential later-stage outcome / shipped-accessed if appropriate
```

For the required notebook, contracts and qualified applicants are enough. If later-stage outcomes are added, they should be clearly synthetic and used carefully.

---

# 8. Data Pipeline & Integrity section

Although the main notebook-build focus will likely be on recommender systems first, the agent should understand the upstream data-pipeline story because Lab A should ideally consume the cleaned output of this section.

The synthetic raw data can mimic issues such as:

- duplicate schools
- inconsistent school names
- missing stable identifiers
- stale records
- missing pipeline states
- duplicated interactions
- inconsistent date formats
- impossible values
- missing downstream outcomes
- school names written as variants such as:
  - Jefferson HS
  - Jefferson High
  - JEFFERSON HIGH SCHOOL

A clean final school summary could include:

```text
school_id
school_name
recruiter_hours
contacts
appointments
qualified
contracts
access_score
distance_miles
data_quality
```

A useful reveal is that after entity resolution, apparently separate schools combine into one school and its historical performance changes.

The data-pipeline lesson is:

> **AI built on bad operational data does not magically fix bad operational data.**

---

# 9. Recommender section - final simplified design

The recommender section should be one **self-contained Jupyter notebook** with two labs.

The notebook should generate its own synthetic data using a fixed random seed so it can run without external CSV files.

At a high level:

| Lab | Question | Main technique | Output |
|---|---|---|---|
| **Lab A - WHERE?** | Which schools should we prioritize? | Feature-based scoring + Top-K ranking | Ranked schools |
| **Lab B - WHAT?** | What engagement should we try at a selected school? | Collaborative filtering, with optional content-based/hybrid extension | Ranked actions |

The required algorithms should stay small and interpretable.

Required concepts:

```text
Lab A
- downstream efficiency
- feature normalization
- weighted scoring
- operational filtering
- Top-K ranking

Lab B
- school x action interaction matrix
- missing interactions / sparsity
- cosine similarity on historical behavior
- similarity-weighted prediction
- Top-K action recommendation

Optional
- content-based action similarity
- hybrid scoring
- matrix-factorization concept only
```

Do **not** overload the required lab with SVD, Surprise, complex learning-to-rank, or optimization.

---

# 10. Recommender Lab A - WHERE should we focus?

## 10.1 Lab objective

> **Rank schools according to how promising they appear for future recruiting effort, emphasizing downstream success rather than raw appointment volume.**

This lab is intentionally simple.

The student should learn:

1. Recommendations depend on the objective.
2. Historical activity is not the same thing as historical value.
3. Recommenders rank candidates based on evidence.
4. Operational constraints matter.
5. A score should be explainable.

## 10.2 Lab A data

Use approximately **20 synthetic schools**.

Minimal table:

```python
schools = pd.DataFrame({
    "school_id": [...],
    "school_name": [...],

    # Historical recruiting activity
    "recruiter_hours": [...],
    "appointments": [...],
    "qualified": [...],
    "contracts": [...],

    # Operational characteristics
    "access_score": [...],      # 0 to 1
    "distance_miles": [...],
    "data_quality": [...]       # 0 to 1
})
```

Example rows:

| school_name | recruiter_hours | appointments | qualified | contracts | access_score | distance_miles | data_quality |
|---|---:|---:|---:|---:|---:|---:|---:|
| Lincoln High | 100 | 140 | 35 | 14 | 0.90 | 8 | 0.95 |
| Jefferson High | 100 | 80 | 40 | 24 | 0.85 | 12 | 0.94 |
| Washington High | 100 | 60 | 36 | 25 | 0.72 | 18 | 0.91 |
| Roosevelt High | 90 | 75 | 32 | 18 | 0.95 | 6 | 0.88 |

The exact synthetic values should be constructed so the ranking changes when the metric changes.

## 10.3 Lab A skeleton

### A1 - Naive ranking by appointments

```python
schools.sort_values(
    "appointments",
    ascending=False
)[["school_name", "appointments"]].head()
```

Discussion question:

> If you only saw this table, where would you send recruiters?

The intended result is that a school such as Lincoln looks best because it has high appointment volume.

### A2 - Look downstream

```python
schools["qualified_rate"] = (
    schools["qualified"] /
    schools["appointments"]
)

schools["contracts_per_hour"] = (
    schools["contracts"] /
    schools["recruiter_hours"]
)
```

Then rank by downstream efficiency:

```python
schools.sort_values(
    "contracts_per_hour",
    ascending=False
)[[
    "school_name",
    "appointments",
    "qualified",
    "contracts",
    "contracts_per_hour"
]].head()
```

Teaching point:

> Most appointments does not necessarily equal best use of recruiter time.

### A3 - Build a simple opportunity score

Use only three components so the logic remains transparent:

```text
60% = historical downstream success
25% = qualification rate
15% = school access
```

Normalize:

```python
from sklearn.preprocessing import MinMaxScaler

features = [
    "contracts_per_hour",
    "qualified_rate",
    "access_score"
]

scaler = MinMaxScaler()
normalized = scaler.fit_transform(schools[features])

schools[[
    "success_norm",
    "qualified_norm",
    "access_norm"
]] = normalized
```

Score:

```python
schools["opportunity_score"] = (
    0.60 * schools["success_norm"]
    + 0.25 * schools["qualified_norm"]
    + 0.15 * schools["access_norm"]
)
```

### A4 - Apply operational constraints

Example:

```python
eligible = schools[
    (schools["distance_miles"] <= 30)
    & (schools["data_quality"] >= 0.70)
].copy()
```

This demonstrates the recommender workflow:

```text
score -> filter -> rank -> Top K
```

### A5 - Return the Top K schools

```python
top_schools = (
    eligible
    .sort_values("opportunity_score", ascending=False)
    .head(5)
)

top_schools[[
    "school_name",
    "opportunity_score",
    "contracts_per_hour",
    "qualified_rate",
    "access_score"
]]
```

Optional simple visualization:

```python
top_schools.plot.barh(
    x="school_name",
    y="opportunity_score"
)

plt.gca().invert_yaxis()
plt.title("Recommended Schools")
plt.show()
```

## 10.4 Lab A takeaway

> **A recommender does not discover a universal "best" school. It ranks candidate schools according to an explicitly defined objective, evidence, and constraints.**

## 10.5 Lab A should NOT include

Do not make the required version use:

- collaborative filtering
- matrix factorization
- a complex supervised ML model
- optimization/scheduling
- demographic targeting

Those would obscure the main lesson.

---

# 11. Recommender Lab B - WHAT should we do there?

## 11.1 Lab objective

Select one school from Lab A, for example:

```python
target_school = "Jefferson High"
```

Then ask:

> **What recruiting engagement/action should we try at this school?**

This is the more classic recommender-system lab.

The central analogy is:

```text
Traditional recommender
User -> Movie -> Rating

USARD lab
School -> Recruiting Action -> Historical Effectiveness
```

The student should learn:

1. Interaction histories can be arranged as a user-item style matrix.
2. Missing cells mean "unobserved," not "failed."
3. Collaborative filtering uses behavior from similar entities.
4. Similarity-weighted prediction can infer promising untried actions.
5. Content-based information can help with cold-start cases.
6. Hybrid recommenders combine complementary evidence.

## 11.2 Lab B actions

Use approximately six actions:

```python
actions = [
    "Cyber Careers Event",
    "STEM Careers Presentation",
    "Mechanical Careers Demo",
    "Healthcare Careers Session",
    "Education Benefits Session",
    "General Recruiting Table"
]
```

## 11.3 Lab B event-level data

Use historical school-action engagement data:

```python
engagements = pd.DataFrame({
    "school_name": [...],
    "action": [...],
    "recruiter_hours": [...],
    "appointments": [...],
    "qualified": [...],
    "contracts": [...]
})
```

Example rows:

| school_name | action | recruiter_hours | appointments | qualified | contracts |
|---|---|---:|---:|---:|---:|
| Jefferson High | Cyber Careers Event | 8 | 14 | 9 | 5 |
| Jefferson High | STEM Careers Presentation | 6 | 11 | 7 | 4 |
| Jefferson High | Education Benefits Session | 7 | 10 | 5 | 2 |
| Lincoln High | Mechanical Careers Demo | 7 | 13 | 10 | 6 |
| Washington High | Cyber Careers Event | 8 | 16 | 11 | 7 |

Not every school should have tried every action.

The synthetic data should deliberately leave some school-action combinations unobserved.

For example, Jefferson should have no Mechanical Careers Demo history so that the collaborative recommender can infer whether that action may be promising.

## 11.4 Lab B skeleton

### B1 - Convert historical outcomes to an effectiveness signal

Keep it simple:

```python
engagements["effectiveness"] = (
    engagements["contracts"] /
    engagements["recruiter_hours"]
)
```

If multiple events exist for the same school-action pair, aggregate them:

```python
school_action = (
    engagements
    .groupby(["school_name", "action"])["effectiveness"]
    .mean()
    .unstack()
)
```

Example conceptual matrix:

| School | Cyber | STEM | Mechanical | Healthcare | Education |
|---|---:|---:|---:|---:|---:|
| Jefferson | 0.63 | 0.67 | NaN | 0.10 | 0.29 |
| Lincoln | 0.30 | 0.63 | 0.86 | 0.10 | 0.25 |
| Washington | 0.70 | 0.60 | 0.65 | 0.15 | 0.35 |
| Roosevelt | 0.20 | 0.30 | 0.25 | 0.75 | 0.45 |

Important teaching point:

> **NaN means "we have not observed this combination," not "the action failed."**

This introduces sparsity in recommender systems.

### B2 - Find schools that behave similarly

This is **school-school collaborative filtering**.

Use a helper that calculates cosine similarity only over actions observed for both schools.

```python
def cosine_on_overlap(a, b):
    """
    Cosine similarity using only actions
    observed for both schools.
    """

    mask = a.notna() & b.notna()

    if mask.sum() < 2:
        return np.nan

    x = a[mask].to_numpy()
    y = b[mask].to_numpy()

    return np.dot(x, y) / (
        np.linalg.norm(x) *
        np.linalg.norm(y)
    )
```

Then:

```python
target = school_action.loc[target_school]

similarities = {}

for school in school_action.index:
    if school == target_school:
        continue

    similarities[school] = cosine_on_overlap(
        target,
        school_action.loc[school]
    )

similarities = pd.Series(
    similarities
).sort_values(ascending=False)

similarities.head()
```

Desired style of result:

```text
Washington High     0.92
North County        0.88
Lincoln High        0.81
Roosevelt High      0.31
```

Teaching point:

> These schools are similar because recruiting actions have historically performed similarly there, not necessarily because the schools have identical descriptive characteristics.

### B3 - Predict an untried action

For an action Jefferson has not tried, calculate a similarity-weighted estimate from other schools.

```python
def predict_action(
    target_school,
    action,
    matrix,
    similarities
):

    numerator = 0
    denominator = 0

    for school, similarity in similarities.items():
        value = matrix.loc[school, action]

        if pd.notna(value) and similarity > 0:
            numerator += similarity * value
            denominator += similarity

    if denominator == 0:
        return np.nan

    return numerator / denominator
```

Then:

```python
predict_action(
    "Jefferson High",
    "Mechanical Careers Demo",
    school_action,
    similarities
)
```

Intuitive explanation:

```text
Washington did well with Mechanical
        x
Washington behaves similarly to Jefferson

+

Lincoln did well with Mechanical
        x
Lincoln also behaves similarly to Jefferson

        ->
Mechanical may be promising at Jefferson
```

### B4 - Predict all untried actions

```python
predictions = {}

for action in school_action.columns:
    if pd.isna(school_action.loc[target_school, action]):
        predictions[action] = predict_action(
            target_school,
            action,
            school_action,
            similarities
        )

pd.Series(predictions).sort_values(ascending=False)
```

### B5 - Return Top-K actions

Create one final ranking that combines known historical performance for actions already tried at the school and predicted effectiveness for untried actions.

```python
recommendations = school_action.loc[target_school].copy()

for action, prediction in predictions.items():
    recommendations[action] = prediction

recommendations.sort_values(ascending=False).head(3)
```

Desired style of output:

```text
JEFFERSON HIGH - RECOMMENDED ACTIONS

1. Mechanical Careers Demo      0.72  <- predicted
2. STEM Careers Presentation    0.67  <- observed
3. Cyber Careers Event          0.63  <- observed
```

The exact ranking should be designed intentionally in the synthetic data.

---

# 12. Optional Lab B extension - Content-based recommendation

If time permits, add a small content-based section.

This helps students understand the distinction between:

> **Collaborative:** What worked at schools that behaved like Jefferson?

and

> **Content-based:** What actions fit what we know about Jefferson?

## 12.1 School profiles

```python
school_profiles = pd.DataFrame({
    "school_name": [...],
    "cyber": [...],
    "engineering": [...],
    "mechanical": [...],
    "healthcare": [...],
    "education": [...]
}).set_index("school_name")
```

Example Jefferson profile:

```text
Cyber          0.90
Engineering    0.80
Mechanical     0.65
Healthcare     0.15
Education      0.40
```

These values can be synthetic composites representing program strengths, course offerings, clubs, CTE pathways, or similar aggregate school-level indicators.

## 12.2 Action profiles

```python
action_profiles = pd.DataFrame({
    "action": actions,
    "cyber": [...],
    "engineering": [...],
    "mechanical": [...],
    "healthcare": [...],
    "education": [...]
}).set_index("action")
```

Example Mechanical Careers Demo profile:

```text
Cyber          0.10
Engineering    0.60
Mechanical     1.00
Healthcare     0.00
Education      0.20
```

## 12.3 Cosine similarity

```python
from sklearn.metrics.pairwise import cosine_similarity

school_vector = school_profiles.loc[
    target_school
].values.reshape(1, -1)

content_scores = cosine_similarity(
    school_vector,
    action_profiles.values
)[0]

content_scores = pd.Series(
    content_scores,
    index=action_profiles.index
)
```

The key teaching point is that the **same cosine-similarity idea** can be used in two different ways:

- similarity of descriptive features -> content-based recommendation
- similarity of historical behavior -> collaborative filtering

---

# 13. Optional Lab B extension - Hybrid recommendation

If time permits, combine collaborative and content-based evidence.

Concept:

```text
What do we know ABOUT Jefferson?
        -> content-based score

+

What WORKED at schools behaving like Jefferson?
        -> collaborative score

        ->
Hybrid recommendation
```

Simple example:

```python
collab_scores = recommendations.copy()

collab_norm = (
    collab_scores - collab_scores.min()
) / (
    collab_scores.max() - collab_scores.min()
)

hybrid = (
    0.60 * collab_norm
    + 0.40 * content_scores
)

hybrid.sort_values(ascending=False).head(3)
```

Do not spend too much time tuning the exact weights. The important idea is that different evidence sources can complement one another.

---

# 14. Matrix factorization / SVD - optional concept only

The supplied slides and the existing anime notebook both include matrix factorization / SVD.

For the USARD course, this should **not** be a required implementation in the main 45-minute Lab B.

A brief explanation is enough:

```text
School x Action matrix
        ->
Many missing values
        ->
Matrix factorization / SVD
        ->
Latent factors
        ->
Predicted missing preferences/effectiveness
```

Possible latent patterns might resemble:

- technical vs. nontechnical orientation
- hands-on vs. informational engagements
- career-specific vs. broad-benefits engagement

But those latent dimensions are learned by the model and may be harder to interpret.

If a prewritten optional cell is included, it should be clearly labeled as advanced / optional.

---

# 15. Relationship to the supplied "Recommendation Systems.ipynb"

The uploaded reference notebook is an anime recommendation notebook.

It contains:

- anime metadata
- user ratings
- data cleaning/preprocessing
- content-based filtering
- TF-IDF features from anime genres/type
- cosine similarity
- user-item interaction matrices
- collaborative filtering
- TruncatedSVD
- Surprise SVD
- hybrid recommendation
- ranking evaluation such as Precision@K, Recall@K, and NDCG@K

It is useful as a **reference**, but it is much broader and more advanced than what should be required in the USARD labs.

The conceptual mapping is:

```text
ANIME NOTEBOOK                  USARD NOTEBOOK

user                     ->     school
anime                    ->     recruiting action
rating                   ->     historical effectiveness
user x anime matrix      ->     school x action matrix
recommended anime        ->     recommended action
```

Recommended reuse:

- **Lab A:** mostly new; the anime notebook does not directly address this school-opportunity ranking problem.
- **Lab B:** heavily inspired by the anime notebook's interaction matrix, collaborative filtering, cosine similarity, and optional hybrid logic.
- **SVD / Surprise:** optional only.
- **Ranking metrics:** move to later evaluation/red-team section if time is limited.
- **TF-IDF:** unnecessary for the core USARD lab. Numeric school/action profiles are easier to explain.

---

# 16. Synthetic-data design principles

The synthetic data should not be random noise. It should contain **intentional hidden structure** and intentional classroom reveals.

## 16.1 Lab A hidden story

Design schools so that:

- one school has **high appointment volume but weak downstream conversion**
- another has **lower appointment volume but strong contracts per recruiter-hour**
- one school has strong historical results but poor current data quality and gets filtered
- one school has decent outcomes but excessive distance and gets filtered

This creates the desired sequence:

```text
Rank by appointments
        -> Lincoln looks best

Look downstream
        -> ranking changes

Apply constraints
        -> ranking changes again
```

## 16.2 Lab B hidden story

Design the school-action matrix so that:

- Jefferson has observed good performance for Cyber and STEM
- Jefferson has **never tried Mechanical**
- schools whose observed patterns resemble Jefferson have strong Mechanical performance
- collaborative filtering therefore recommends Mechanical as a promising untried action
- Roosevelt should behave differently, for example with strong Healthcare performance, so it is not considered highly similar to Jefferson

This creates the main collaborative-filtering reveal:

> The algorithm can recommend an action that Jefferson has never tried by learning from similar historical behavior elsewhere.

## 16.3 Cold-start concept

If possible, include one school with very little interaction history so students can see why collaborative filtering struggles and why content-based attributes can help.

## 16.4 Exposure-bias concept

Historical data should also support a later discussion:

> Are we learning what actually works, or are we learning what recruiters historically chose to try most often?

This is a key responsible-recommender issue.

---

# 17. Recommender evaluation and red-team ideas

The supplied recommender slides emphasize that ordinary classification accuracy is not enough because recommendation output is a ranked list.

Potential ranking metrics to mention later:

- Precision@K
- Recall@K
- NDCG@K

Potential operational measures:

- downstream success among Top-K recommendations
- time saved
- stability across runs
- coverage
- rate of recommendations rejected due to stale/bad data

For the required Lab A and Lab B, do **not** make rigorous train/test ranking evaluation the main activity because time is limited.

Instead, save it for the later Test, Evaluation, Red Team block or Day 3.

Useful red-team cases:

1. **Wrong metric** - optimizing appointments rather than downstream outcomes.
2. **Sparse data** - one school has only one historical event.
3. **Exposure bias** - historically visited schools look best because they have the most observations.
4. **Stale data** - old performance is treated as current.
5. **Poor data quality** - a high-ranked school has unreliable CRM history.
6. **Proxy / bias issue** - a problematic variable improves score but should not be used.
7. **Collaborative-filtering failure** - similarity is driven by very few overlapping actions.
8. **RAG failure** - wrong or irrelevant source is retrieved.
9. **Hallucination** - LLM invents a benefit, incentive, or policy.
10. **Agent failure** - agent proposes an infeasible schedule or acts despite insufficient confidence.

Core message:

> A high score is not permission to automate a recruiting decision without review.

---

# 18. Generative AI + RAG section

After the recommender section, the story should continue naturally.

At this point the system has produced:

```text
WHERE?
Jefferson High

WHAT?
Mechanical Careers Demo / STEM Careers Event / etc.
```

The next question is:

> **What should the recruiter know before engaging at that school?**

This is the purpose of RAG.

## 18.1 RAG concept

The recommender answers **what appears promising**.

RAG provides **grounded, authoritative information** the recruiter needs to prepare.

Possible knowledge-base documents could include synthetic or approved/sanitized content such as:

```text
army_cyber_overview.txt
education_benefits.txt
technical_training.txt
career_catalog.txt
recruiting_faq.txt
```

The pipeline is:

```text
Selected school
      +
Recommended action
      +
Approved knowledge base
      ->
Retrieve relevant evidence
      ->
LLM
      ->
Recruiter Engagement Brief
```

Possible output:

```text
JEFFERSON HIGH - ENGAGEMENT BRIEF

Why this engagement was recommended
-----------------------------------
Historical school/action evidence...

Suggested focus
---------------
STEM and technical career pathways...

Relevant Army opportunities
----------------------------
Grounded content from retrieved sources...

Supporting sources
------------------
[Career Catalog]
[Education Benefits Guide]
```

## 18.2 RAG teaching point

> **Recommendation tells us what may be relevant. RAG tells the LLM what authoritative information it should use when explaining or preparing the recruiter.**

This is better than teaching chunking/embeddings/vector databases as disconnected mechanics.

## 18.3 Important RAG safety idea

A naive LLM might invent:

- benefits
- eligibility requirements
- training details
- incentives
- current availability

RAG provides a reason to retrieve and cite approved information before generating the brief.

---

# 19. Agentic AI section

After students have built disconnected capabilities, ask:

> Why should a recruiter have to manually run several separate notebook steps?

The agentic lab should show an AI agent orchestrating tools.

Possible tools:

```python
rank_schools()
recommend_actions(school)
get_school_history(school)
retrieve_approved_information(query)
generate_engagement_brief(...)
validate_recommendation(...)
```

A later/advanced tool could be:

```python
build_schedule(hours_available)
```

## 19.1 Example agent request

> "I have two recruiters and 16 field hours next week. Give me a plan."

The agent might:

```text
Check school opportunities
        ->
Rank schools
        ->
Recommend actions for top schools
        ->
Consider recruiter time / travel
        ->
Retrieve authoritative information
        ->
Create engagement briefs
        ->
Run validation checks
        ->
Return plan for human review
```

## 19.2 Important technical distinction

The overall AI solution may use several techniques:

- **Recommendation** estimates what looks promising.
- **Prediction** estimates expected outcomes.
- **Optimization** allocates scarce resources.
- **RAG** grounds language generation.
- **Agents** coordinate tools and workflow.

This is a useful lesson because real AI systems are rarely one algorithm.

---

# 20. Resource optimization - later, not in the core recommender labs

The planning discussion considered using limited recruiter hours explicitly.

The final operational decision is really about a **school-action pair**:

| School | Action | Expected Success | Hours | Value per Hour |
|---|---|---:|---:|---:|
| Jefferson | STEM | 3.7 | 3.5 | 1.06 |
| Lincoln | Mechanical | 4.1 | 3.5 | 1.17 |
| Roosevelt | Healthcare | 3.8 | 3.0 | 1.27 |

With a fixed time budget, the final problem becomes constrained optimization:

```text
maximize expected downstream success
subject to total recruiter hours <= available hours
```

Potential constraints:

- no more than one event at a school per week
- total recruiter hours
- travel time
- some actions require two recruiters
- some schools are unavailable on certain days
- equipment availability

However, this should **not** be in the required recommender notebook because it would overload the 30- and 45-minute lab periods.

Save optimization for:

- Agentic Integration
- Day 3 end-to-end application
- capstone extension

---

# 21. Validation / human oversight section

The final part of Day 2 should intentionally break the system.

Potential automated validation gates:

```python
assert data_quality_score > threshold
assert recommendation_confidence > threshold
assert sources_found >= minimum_sources
assert every_claim_has_source
assert prohibited_fields_not_used
assert schedule_is_feasible
```

Conceptually:

```text
AI Recommendation
      ->
Automated Checks
      ->
Confidence / Evidence
      ->
Human Review
      ->
Operational Action
```

Core message:

> **An agent is not valuable merely because it can act autonomously. It is valuable when it can execute a useful workflow within defined constraints, evidence standards, and human oversight.**

---

# 22. Recommended notebook UX and pedagogy

The notebooks should be easy to follow in a live classroom.

Recommended style:

- One question per section.
- Short markdown explanations before code.
- Small, readable tables.
- Prefer transparent calculations over black-box models.
- Use fixed random seeds.
- Avoid external APIs for core notebook functionality.
- Avoid long package installations.
- Keep code cells small.
- Include deliberate "pause and predict" questions before showing outputs.
- Use simple visualizations only when they reinforce the story.
- Make each lab runnable top-to-bottom without manual file loading.
- Keep optional/advanced material clearly separated.

Suggested prompts inside the notebook:

- "Which school looks best if you only look at appointments?"
- "What changes when we care about contracts per recruiter-hour?"
- "What does NaN mean in the school-action matrix?"
- "Why might two schools be behaviorally similar even if their descriptive features differ?"
- "Would you automatically act on this recommendation? Why or why not?"

---

# 23. Recommended structure for the self-contained recommender notebook

```text
Precision Recruiting with Recommender Systems

0. Scenario and learning objectives
1. Imports and random seed
2. Generate synthetic school data
3. Generate synthetic school-action history

LAB A - WHERE SHOULD WE FOCUS?
4. Naive ranking by appointments
5. Calculate downstream metrics
6. Normalize features
7. Build school opportunity score
8. Apply constraints
9. Return Top-5 schools
10. Brief discussion

LAB B - WHAT SHOULD WE DO THERE?
11. Calculate action effectiveness
12. Build school x action matrix
13. Inspect sparsity / missing cells
14. Find behaviorally similar schools
15. Predict an untried action
16. Predict all untried actions
17. Return Top-3 actions
18. Brief discussion

OPTIONAL EXTENSION
19. School and action feature profiles
20. Content-based similarity
21. Hybrid score
22. Brief matrix-factorization concept

23. Reflection / transition to RAG
```

A good final transition is:

> "We now know where we might focus and what engagement might work. But the recruiter still needs authoritative information before acting. That is where RAG comes in."

---

# 24. Minimal required code concepts

Keep the required code surface small.

```python
# Lab A
contracts / recruiter_hours
qualified / appointments
MinMaxScaler()
weighted_sum
boolean filtering
sort_values()
head(k)

# Lab B
groupby()
unstack() or pivot_table()
NaN / missing values
cosine similarity on overlap
similarity-weighted average
sort_values()
head(k)
```

Optional:

```python
sklearn.metrics.pairwise.cosine_similarity
hybrid weighted score
TruncatedSVD
```

This is enough to teach the important ideas without turning the exercise into a full recommender-systems course.

---

# 25. What the agent building the notebooks should prioritize

When building the actual notebooks, prioritize the following in order:

1. **Cohesive story over algorithmic breadth.**
2. **Self-contained execution.**
3. **Clear downstream-outcome framing.**
4. **Intentional synthetic data with visible reveals.**
5. **Explainability.**
6. **A meaningful distinction between Lab A and Lab B.**
7. **A clean transition into RAG and agents.**
8. **Responsible-AI / validation questions throughout.**
9. **Optional advanced sections rather than mandatory complexity.**

Do not build a giant notebook simply because the reference anime notebook contains many algorithms.

The desired student experience is:

```text
"I understand why the recommendation changed."

not

"I ran a complicated model and got a number."
```

---

# 26. Final high-level framing to preserve

The central technical-track story is:

> **The class is building a Precision Recruiting Assistant that learns from historical recruiting outcomes to help a station decide where limited recruiter time appears most likely to produce successful downstream outcomes, what type of engagement may be effective at those schools, what grounded information a recruiter should know before acting, and when the AI recommendation should or should not be trusted.**

Each section has one job:

- **Data pipeline:** establish trustworthy history.
- **Lab A - school ranking:** identify where effort appears promising.
- **Lab B - engagement recommender:** identify what action may work there.
- **RAG:** prepare the recruiter with grounded authoritative information.
- **Agentic AI:** coordinate the workflow and potentially resource allocation.
- **Validation:** determine when the system should and should not be trusted.

The student-facing mental model should remain simple:

```text
CAN WE TRUST THE DATA?
        ->
WHERE SHOULD WE FOCUS?
        ->
WHAT SHOULD WE DO THERE?
        ->
WHAT SHOULD THE RECRUITER KNOW?
        ->
CAN WE TRUST THE RECOMMENDATION?
```

That structure is tightly aligned with BG Dudley's stated desire for anything that helps USARD become more precise, identify areas with potential, make better use of constrained staffing/funding, and move beyond generic recruiting activity toward purposeful recruiting decisions.

---

# 27. Suggested next deliverables for the notebook-building agent

The next agent should ideally produce the following in sequence:

1. **A finalized synthetic-data design** for the recommender notebook, including exact generated distributions and intentional school/action patterns.
2. **A complete self-contained Lab A + Lab B Jupyter notebook** using the skeleton above.
3. **Instructor notes / answer key** explaining expected outputs and key talking points.
4. **A student version** with selected code or questions left for participants to complete.
5. **A RAG notebook** that consumes the recommender output and generates a grounded recruiter engagement brief.
6. **An Agentic Integration notebook** that exposes notebook functionality as tools and orchestrates the workflow.
7. **A test/evaluation/red-team notebook or section** with intentionally broken cases.
8. **A Day 3 capstone scaffold** that lets teams extend the Precision Recruiting Assistant or apply the same R.O.A.D. thinking to another recruiting workflow.

The agent should first get the recommender notebook working cleanly before adding complexity elsewhere.

