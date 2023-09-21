import '../../Home.css';
import React from 'react';
import { Link } from 'react-router-dom';
import { FHIRData, displayDate } from '../../data-services/models/fhirResources';
import { MedicationSummary } from '../../data-services/models/cqlSummary';
import { Summary, SummaryRowItems } from './Summary';
import { BusySpinner } from '../busy-spinner/BusySpinner';

interface MedicationListProps {
  fhirDataCollection?: FHIRData[],
  medicationSummaryMatrix?: MedicationSummary[][],
}

interface MedicationListState {
}

export const MedicationList: React.FC<MedicationListProps> = (props: MedicationListProps) => {
  process.env.REACT_APP_DEBUG_LOG === "true" && console.log("MedicationList component RENDERED!")

  const medSumMatrix: MedicationSummary[][] | undefined = props.medicationSummaryMatrix

  return (
    <div className="home-view">
      <div className="welcome">

        <h4 className="title">Medications</h4>

        {props.fhirDataCollection === undefined
          && <> <p>Reading your clinical records...</p>
            <BusySpinner busy={props.fhirDataCollection === undefined} />
          </>
        }

        {
          medSumMatrix?.map((medicationSummary, index) => {

            return (
              <div key={'outerArray-' + index}>
                <p><b>Provider {index + 1}:</b></p>
                {/* TODO:MULTI-PROVIDER: ConceptName === 'init' needs to refer to either medSumMatrix as a whole,
                 or, we need to initialize all possible rows (how do we know the # ahead of time?) to init vs just the first row.
                 Or, we need a better solution altogether. This applies to ALL summaries which use a summary matrix for display data
                 For now though, it's irrelevant as the data is all loaded ahead of time. If it's a massive data set, it may become relevant */}
                {
                  medicationSummary && medicationSummary.length > 0 && medicationSummary[0]?.ConceptName === 'init'
                    ? <p>Loading...</p>
                    : (!medicationSummary || medicationSummary.length < 1) && props.fhirDataCollection !== undefined
                      ? <p>No records found.</p>
                      :
                      <div>
                        {medicationSummary?.map((med, idx) => (
                          <Summary key={idx} id={idx} rows={buildRows(med)} />
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

const buildRows = (med: MedicationSummary): SummaryRowItems => {
  let rows: SummaryRowItems =
    [
      {
        isHeader: true,
        twoColumns: true,
        data1: med.ConceptName ?? "No text",
        data2: med.LearnMore === undefined || med.LearnMore === null ? '' :
          <Link to="route" target="_blank"
            onClick={
              (event) => { event.preventDefault(); window.open(med.LearnMore); }
            }><i>Learn&nbsp;More</i>
          </Link>,
      },
      {
        isHeader: false,
        twoColumns: true,
        data1: displayDate(med.AuthoredOn),
        data2: 'By: ' + (med.Requester ?? 'Unknown'),
      },
      {
        isHeader: false,
        twoColumns: false,
        data1: med.DosageInstruction,
        data2: '',
      },
    ]

  const notes: SummaryRowItems | undefined = med.Notes?.map((note) => (
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

  const provenance: SummaryRowItems | undefined = med.Provenance?.map((provenance) => (
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
