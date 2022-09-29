import '../../Home.css'
import React from 'react'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FHIRData, hasScope, displayDate } from '../../data-services/models/fhirResources'
import { PatientSummary, GoalSummary, GoalTarget } from '../../data-services/models/cqlSummary'
import { getGoalSummary } from '../../data-services/mccCqlService'
import { Summary, SummaryRowItem, SummaryRowItems } from './Summary'
import { BusySpinner } from '../busy-spinner/BusySpinner'

interface GoalListProps {
  fhirData?: FHIRData,
  patientSummary?: PatientSummary
}

interface GoalListState {
  goalSummary?: GoalSummary[]
}

export const GoalList: React.FC<GoalListProps> = (props: GoalListProps) => {

  const [goalSummary, setGoalSummary] = useState<GoalSummary[] | undefined>([{ Description: 'init' }])

  useEffect(() => {
    console.time('getGoalSummary()')
    setGoalSummary(getGoalSummary(props.fhirData))
    console.timeEnd('getGoalSummary()')
  }, [props.fhirData])

  return (
    <div className="home-view">
      <div className="welcome">

        <h4 className="title">Health Goals</h4>

        {props.fhirData === undefined
          && <> <p>Reading your clinical records...</p>
            <BusySpinner busy={props.fhirData === undefined} />
          </>
        }

        {hasScope(props.fhirData?.clientScope, 'Goal.write')
          ? <p><Link to={{ pathname: '/goal-edit', state: { fhirData: props.fhirData } }}>Add a New Goal</Link></p>
          : <p />}

        {goalSummary && goalSummary.length > 0 && goalSummary[0]?.Description === 'init'
          ? <p>Loading...</p>
          : (!goalSummary || goalSummary.length < 1) && props.fhirData !== undefined
            ? <p>No records found.</p>
            :
            <>
              {goalSummary?.map((goal, idx) => (
                <Summary key={idx} id={idx} rows={buildRows(goal)} />
              ))}
            </>
        }

      </div>
    </div>
  )

}

const buildRows = (goal: GoalSummary): SummaryRowItems => {
  let rows: SummaryRowItems =
    [
      {
        isHeader: true,
        twoColumns: false,
        data1: goal.Description,
        data2: '',
      },
      {
        isHeader: false,
        twoColumns: true,
        data1: goal.ExpressedBy,
        data2: goal.StartDate === null ? ''
          : 'Start: ' + displayDate(goal.StartDate),
      },
    ]

  const targets: SummaryRowItems = buildTargets(goal)
  if (targets?.length) {
    rows = rows.concat(targets)
  }

  const addresses: SummaryRowItems | undefined = goal.Addresses?.map((concern) => (
    {
      isHeader: false,
      twoColumns: false,
      data1: 'Addresses: ' + (concern.DisplayName ?? 'Unknown'),
      data2: '',
    }
  ))
  if (addresses?.length) {
    rows = rows.concat(addresses)
  }

  const learnMore: SummaryRowItem = {
    isHeader: false,
    twoColumns: false,
    data1: goal.LearnMore === undefined || goal.LearnMore === null ? '' :
      <Link to="route" target="_blank"
        onClick={
          (event) => { event.preventDefault(); window.open(goal.LearnMore); }
        }><i>Learn&nbsp;More</i>
      </Link>,
    data2: '',
  }
  rows.push(learnMore)

  const notes: SummaryRowItems | undefined = goal.Notes?.map((note) => (
    {
      isHeader: false,
      twoColumns: false,
      data1: 'Note: ' + note,
      data2: '',
    }
  ))
  if (notes?.length) {
    rows = rows.concat(notes)
  }

  const provenance: SummaryRowItems | undefined = goal.Provenance?.map((provenance) => (
    {
      isHeader: false,
      twoColumns: true,
      data1: 'Source: ' + provenance.Transmitter ?? '',
      data2: provenance.Author ?? '',
    }
  ))
  if (provenance?.length) {
    rows = rows.concat(provenance)
  }

  return rows
}

const buildTargets = (goal: GoalSummary): SummaryRowItems => {
  let targets: SummaryRowItems = []

  goal.Target?.forEach((curTarget) => {

    let isPushLastResultTextAndDateOnly: boolean = (curTarget.DueDate === null || curTarget.DueDate === undefined)
      && (curTarget.TargetValue === null || curTarget.TargetValue === undefined)

    let isPushTargetValueAndDueDateOnly: boolean = !curTarget.LastResult || !curTarget.LastResult.Date

    let isPushBoth = !isPushLastResultTextAndDateOnly && !isPushTargetValueAndDueDateOnly

    if (isPushLastResultTextAndDateOnly && !isPushTargetValueAndDueDateOnly) {
      // Skip targetValueAndDueDate, add lastResultTextAndDate only
      targets.push(buildLastResultTextAndDate(curTarget))
    } else if (isPushTargetValueAndDueDateOnly && !isPushLastResultTextAndDateOnly) {
      // Skip lastResultTextAndDate, add targetValueAndDueDate only
      targets.push(buildTargetValueAndDueDate(curTarget))
    } else if (isPushBoth) {
      // Push both targetValueAndDueDate and lastResultTextAndDate as enough data is valid
      targets.push(buildTargetValueAndDueDate(curTarget))
      targets.push(buildLastResultTextAndDate(curTarget))
    }

  })

  return targets
}

const buildLastResultTextAndDate = (curTarget: GoalTarget): SummaryRowItem => {
  return {
    isHeader: false,
    twoColumns: false,
    data1: 'Last Value: ' + (curTarget.LastResult?.ResultText ?? '?') + ' on ' + displayDate(curTarget.LastResult?.Date),
    data2: '',
  }
}

const buildTargetValueAndDueDate = (curTarget: GoalTarget): SummaryRowItem => {
  return {
    isHeader: false,
    twoColumns: true,
    data1: curTarget.TargetValue === null ? '' : 'Target: ' + curTarget?.TargetValue,
    data2: curTarget.DueDate === null ? '' : 'Due: ' + displayDate(curTarget?.DueDate),
  }
}
