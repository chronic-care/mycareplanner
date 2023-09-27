import '../../Home.css';
import React from 'react';
import { Link } from "react-router-dom";
import { FHIRData, displayDate } from '../../data-services/models/fhirResources';
import { ObservationSummary } from '../../data-services/models/cqlSummary';
import { Summary, SummaryRowItems } from './Summary';
import { BusySpinner } from '../busy-spinner/BusySpinner';

interface LabResultListProps {
  fhirDataCollection?: FHIRData[],
  labResultSummaryMatrix?: ObservationSummary[][],
}

interface LabResultListState {
}

export const LabResultList: React.FC<LabResultListProps> = (props: LabResultListProps) => {
  process.env.REACT_APP_DEBUG_LOG === "true" && console.log("LabResultList component RENDERED!")

  const labResMatrix: ObservationSummary[][] | undefined = props.labResultSummaryMatrix

  return (
    <div className="home-view">
      <div className="welcome">

        <h4 className="title">Lab Results</h4>

        {props.fhirDataCollection === undefined
          && <> <p>Reading your clinical records...</p>
            <BusySpinner busy={props.fhirDataCollection === undefined} />
          </>
        }

        {
          labResMatrix?.map((labResultSummary, index) => {

            return (
              <div key={'outerArray-' + index}>
                <p><b>Provider {index + 1}:</b></p>
                {
                  labResultSummary && labResultSummary.length > 0 && labResultSummary[0]?.ConceptName === 'init'
                    ? <p>Loading...</p>
                    : (!labResultSummary || labResultSummary.length < 1) && props.fhirDataCollection !== undefined
                      ? <p>No records found.</p>
                      :
                      <div>
                        {labResultSummary?.map((obs, idx) => (
                          <Summary key={idx} id={idx} rows={buildRows(obs)} />
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

const buildRows = (obs: ObservationSummary): SummaryRowItems => {
  let rows: SummaryRowItems =
    [
      {
        isHeader: true,
        twoColumns: true,
        data1: obs.DisplayName,
        data2: obs.LearnMore === undefined || obs.LearnMore === null ? '' :
          <Link to="route" target="_blank"
            onClick={
              (event) => { event.preventDefault(); window.open(obs.LearnMore); }
            }><i>Learn&nbsp;More</i>
          </Link>,
      },
      {
        isHeader: false,
        twoColumns: true,
        data1: obs.ResultText,
        data2: displayDate(obs.Date),
      },
      {
        isHeader: false,
        twoColumns: true,
        data1: obs.ReferenceRange === null ? '' : 'Range: ' + obs.ReferenceRange,
        data2: obs.Interpretation,
      },
      /* May need to be implemented one day...
      {obs.Notes?.map((note, idx) => (
      <tr key={idx}><td colSpan={4}>Note: {note}</td></tr>
      ))} */
    ]

  const provenance: SummaryRowItems | undefined = obs.Provenance?.map((provenance) => (
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
