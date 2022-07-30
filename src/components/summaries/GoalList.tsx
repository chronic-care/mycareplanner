import '../../Home.css'
import React from 'react'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FHIRData, hasScope, displayDate } from '../../data-services/models/fhirResources'
import { PatientSummary, GoalSummary } from '../../data-services/models/cqlSummary'
import { getGoalSummary } from '../../data-services/mccCqlService'

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

        {hasScope(props.fhirData?.clientScope, 'Goal.write')
          ? <p><Link to={{ pathname: '/goal-edit', state: { fhirData: props.fhirData } }}>Add a New Goal</Link></p>
          : <p />}

        {goalSummary && goalSummary.length > 0 && goalSummary[0]?.Description === 'init' ? <p>Loading...</p> : !goalSummary || goalSummary.length < 1 ? <p>No records found.</p> :
          <table><tbody>
            {goalSummary?.map((goal, idx1) => (
              <tr key={idx1}>
                <td>
                  <table>
                    <tbody key='summary'>
                      <tr>
                        <td colSpan={2}><b>{goal.Description}</b></td>
                      </tr>
                      <tr>
                        <td>{goal.ExpressedBy}</td>
                        {(goal.StartDate === null) ? <td /> :
                          <td>Start: {displayDate(goal.StartDate)}</td>}
                      </tr>
                    </tbody>

                    {goal.Target?.map((target, idx2) => (
                      <tbody key='targets'>
                        {(target.DueDate === null && target.TargetValue === null) ? <tr key={'t-' + idx2} /> :
                          <tr key={'t-' + idx2}>
                            <td>{target.TargetValue === null ? '' : 'Target: ' + target.TargetValue}</td>
                            <td>{target.DueDate === null ? '' : 'Due: ' + displayDate(target?.DueDate)}</td>
                          </tr>}

                        {(target.LastResult === null) ? <tr key={'tr-' + idx2} /> :
                          <tr key={'tr-' + idx2}>
                            <td colSpan={2}>Last Value: {target.LastResult?.ResultText ?? '?'} on {displayDate(target.LastResult?.Date)}</td>
                          </tr>}
                      </tbody>
                    ))}

                    <tbody key='addresses'>
                      {goal.Addresses?.map((concern, idx3) => (
                        <tr key={'n-' + idx3}><td colSpan={2}>Addresses: {concern.DisplayName}</td></tr>
                      ))}
                    </tbody>

                    <tbody key='notes'>
                      {goal.LearnMore === null ? <tr /> :
                        <tr><td colSpan={2}><Link to="route" target="_blank" onClick={(event) => { event.preventDefault(); window.open(goal.LearnMore); }}><i>Learn&nbsp;More</i></Link></td></tr>}
                      {goal.Notes?.map((note, idx4) => (
                        <tr key={'n-' + idx4}><td colSpan={2}>Note: {note}</td></tr>
                      ))}
                    </tbody>
                  </table>

                </td>
              </tr>
            ))}
          </tbody></table>
        }

      </div>
    </div>
  )

}
