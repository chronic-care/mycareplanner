library MCCGoals version '0.1.0'

using FHIR version '4.0.1'

include FHIRHelpers version '4.0.1'
include DataElementHelpers called DE
include MCCConcepts called Cx

context Patient

/*
export interface GoalSummary {
  Category?: string,
  Description: string,
  ExpressedBy?: string,
  StartDate?: string,
  Target?: GoalTarget[],
  LifecycleStatus?: string,
  AchievementStatus?: string,
  Notes?: string[],
  Addresses?: ConditionSummary[],
  LearnMore?: string
}

export interface GoalTarget {
  DueDate?: string,
  DisplayName?: string,
  TargetValue?: string,
  LastResult?: ObservationSummary,
}
*/

define GoalSummary:
  ReportGoals(
    "Active Goals" G sort by (start as FHIR.date).value descending
  )

define "Active Goals":
  [Goal] G 
    where G.lifecycleStatus in {'active', 'completed', 'cancelled', 'on-hold'}

define function ReportGoals(goals List<Goal>):
  goals G
    return ReportGoal(G)
  
define function ReportGoal(goal Goal):
  {
    Category: DE.ConceptText(goal.category[0]),   // TODO: array of categories
    Description: DE.ConceptText(goal.description),
    ExpressedBy: goal.expressedBy.display.value,
    StartDate: ToString(goal.start),
    Target: if goal.target is not null then ReportGoalTargets(goal) else null,
    Addresses: if goal.addresses is not null then DE.DataElements(AddressesResources(goal)) else null,
    LifecycleStatus: LifecycleStatusText(goal),
    AchievementStatus: DE.ConceptText(goal.achievementStatus),
    Notes: DE.ToString(goal.note),
    Provenance: DE.ReportProvenance(goal),
    LearnMore: DE.LearnMoreURL(goal.target[0].measure),
    Overdue: DueDate(goal) before Today()
  }

define function ReportGoalTargets(goal Goal):
  if goal.target[0].measure ~ Cx."Systolic blood pressure" or goal.target[0].measure ~ Cx."Diastolic blood pressure" then
    {{
      DueDate: ToString(DueDate(goal)),
      DisplayName: 'Blood Pressure',
      TargetValue: 'below ' + ToString(((singleton from (goal.target T where (T.measure ~ Cx."Systolic blood pressure"))).detail as FHIR.Quantity).value)
        + '/' + ToString(((singleton from (goal.target T where (T.measure ~ Cx."Diastolic blood pressure"))).detail as FHIR.Quantity).value) + ' mmHg',
      // LastResult: DE.ReportMostRecentResult(DE.FindObservations(Cx."Blood pressure"))
      LastResult: DE.ReportMostRecentResult(DE.FindObservations(goal.target[0].measure))
    }}
  else
  (goal.target) target
    return {
      DueDate: ToString((target.due as FHIR.date).value),
      DisplayName: DE.ConceptText(target.measure),
      TargetValue: Coalesce(DE.QuantityTextWithComparator((target.detail as Quantity)),
                    DE.RangeText(target.detail as FHIR.Range),
                    DE.ConceptText(target.detail as CodeableConcept),
                    (target.detail as FHIR.string).value),
      LastResult: DE.ReportMostRecentResult(DE.FindObservations(target.measure))
    }

define "Conditions with Goals":
  [Condition] condition
    where exists HasGoals(condition)

define "Conditions without Goals":
  [Condition] condition
    where not exists HasGoals(condition)

define "Conditions with Evidence":
  [Condition] condition
    where exists HasEvidence(condition)

define "Display Conditions without Goals":
  DE.DisplayNames("Conditions without Goals")

define "Display Conditions with Goals":
  [Condition] condition
    let goals: HasGoals(condition),
        evidence: HasEvidence(condition)
    where exists(goals) return {
        Condition: DE.DisplayName(condition),
        HasEvidence: DE.DisplayNames(evidence),
        HasGoals: DE.DisplayNames(goals)
    }

// Returns a list of Resources that this Goal addresses
define function AddressesResources(goal Goal):
  flatten(goal.addresses GA
    return CastToResources(([Condition] C where C.id = DE.GetId(GA.reference)))
      union CastToResources(([Observation] C where C.id = DE.GetId(GA.reference)))
  )

// Takes a list of Condition, Observation, ServiceRequest, etc. and cast to List<Resource>
//  to enable union into generalized List<Resource>
//  Otherwise, union returns, e.g. list<choice<FHIR.Observation,FHIR.Condition>>)
define function CastToResources(items List<Resource>):
 items r
  return r as Resource

// Returns a list of Goals that address this Condition
define function HasGoals(condition Condition):
  [Goal] goal
    where exists(goal.addresses GA
      where condition.id = DE.GetId(GA.reference))

// Returns a list of resources that provide evidence for this Condition.
// TODO: expand to support CodeableConcept as evidence.
define function HasEvidence(condition Condition):
  flatten( condition.evidence.detail E
    return 
        [Observation]res where res.id = DE.GetId(E.reference)
        // TODO: can't pass this result to DE.DisplayNames()
        // ([FamilyMemberHistory] res where res.id = DE.GetId(E.reference))
        // union ([Observation]res where res.id = DE.GetId(E.reference))
        // union ([Procedure]res where res.id = DE.GetId(E.reference))
  )

// Returns Date from the first Goal target that has a due date.
define function DueDate(goal Goal):
  First(goal.target target
    // TODO if due is Duration, add that quantity to startDate
    let due: (target.due as FHIR.date).value
    where due is not null
      return due
  )

define function LifecycleStatusText(g Goal):
  case
    when g.lifecycleStatus.value = 'active' then
      'Active'
    when g.lifecycleStatus.value = 'completed' then
      'Completed'
    when g.lifecycleStatus.value = 'cancelled' then
      'Cancelled'
    when g.lifecycleStatus.value = 'on-hold' then
      'On Hold'
    else
      'Unknown'
  end
