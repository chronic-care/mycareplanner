import '../../Home.css';
import React from 'react';
import { Link } from 'react-router-dom';
import { FHIRData, displayDate } from '../../data-services/models/fhirResources';
import { ConditionSummary } from '../../data-services/models/cqlSummary';
import { Summary, SummaryRowItem, SummaryRowItems } from './Summary';
import { BusySpinner } from '../busy-spinner/BusySpinner';

interface ConditionListProps {
  fhirDataCollection?: FHIRData[],
  conditionSummaryMatrix?: ConditionSummary[][],
  canShareData?: boolean,
}

interface ConditionListState {
}

export const ConditionList: React.FC<ConditionListProps> = (props: ConditionListProps) => {
  process.env.REACT_APP_DEBUG_LOG === "true" && console.log("ConditionList component RENDERED!")

  const conSumMatrix: ConditionSummary[][] | undefined = props.conditionSummaryMatrix

 

  return (
    <div className="home-view">
      <div className="welcome">

        <h4 className="title">Current Health Issues</h4>

        {props.fhirDataCollection === undefined
          && <> <p>Reading your clinical records...</p>
            <BusySpinner busy={props.fhirDataCollection === undefined} />
          </>
        }

        {props.canShareData
          ? <p><Link to={{ pathname: '/condition-edit', state: { fhirData: props.fhirDataCollection } }}>Add a Health Concern</Link></p>
          : <p />}

        {
          conSumMatrix?.map((conditionSummary, index) => {

            return (
              <div key={'outerArray-' + index}>
             
                {
                  conditionSummary && conditionSummary.length > 0 && conditionSummary[0]?.ConceptName === 'init'
                    ? <p>Loading...</p>
                    : (!conditionSummary || conditionSummary.length < 1) && props.fhirDataCollection !== undefined
                      ? <p>No records found.</p>
                      :
                      <div>
                        {conditionSummary?.map((cond, idx) => (
                          <Summary key={idx} id={idx} rows={buildRows(cond,props.fhirDataCollection![index].serverName)} />
                        ))}
                      </div>
                }
              </div>
            )

          })
        }

      </div>
    </div>
  )

}

const buildRows = (cond: ConditionSummary, theSource?:string): SummaryRowItems => {
  let rows: SummaryRowItems = []

  const conditionName: SummaryRowItem = {
    isHeader: true,
    twoColumns: false,
    data1: <>{cond.CommonName ?? cond.ConceptName ?? 'Missing Condition Name'}</>,
    data2: '',
  }
  rows.push(conditionName)

  const author: SummaryRowItem | undefined =
    cond.Recorder === null && cond.Asserter === null
      ? undefined
      : {
        isHeader: false,
        twoColumns: true,
        data1: 'Author: ' + (cond.Recorder ?? cond.Asserter ?? 'Unknown'),
        data2: cond.LearnMore === undefined || cond.LearnMore === null ? '' :
          <Link to="route" target="_blank"
            onClick={
              (event) => { event.preventDefault(); window.open(cond.LearnMore); }
            }><i>Learn&nbsp;More</i>
          </Link>,
      }
  if (author !== undefined) {
    rows.push(author)
  }

  const recordedAndAssertedDates: SummaryRowItem | undefined =
    cond.RecordedDate === null && cond.AssertedDate === null
      ? undefined
      : {
        isHeader: false,
        twoColumns: true,
        // Still need null checks as one item or the other could be null, just not both
        data1: cond.RecordedDate === null ? '' : 'Recorded: ' + displayDate(cond.RecordedDate),
        data2: cond.AssertedDate === null ? '' : 'Asserted: ' + displayDate(cond.AssertedDate),
      }
  if (recordedAndAssertedDates !== undefined) {
    rows.push(recordedAndAssertedDates)
  }

  const onsetDate: SummaryRowItem = {
    isHeader: false,
    twoColumns: false,
    data1: cond.OnsetDate === null ? '' : 'When it started: ' + displayDate(cond.OnsetDate),
    data2: '',
  }
  rows.push(onsetDate)

  const notes: SummaryRowItems | undefined = cond.Notes?.map((note) => (
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

  if (theSource) {
    const source: SummaryRowItem = {
      isHeader: false,
      twoColumns: false,
      data1: 'From ' + theSource,
      data2: '',
    }
    rows.push(source)
  }
 

  const provenance: SummaryRowItems | undefined = cond.Provenance?.map((provenance) => (
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

  const categoryName: SummaryRowItem = {
    isHeader: false,
    twoColumns: true,
    data1: <b>{cond.Category ?? ''}</b>,
    data2: cond.CommonName === null ? '' : cond.ConceptName,
  }
  rows.push(categoryName)

  return rows
}
