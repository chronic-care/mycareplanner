import '../../Home.css';
import React from 'react';
import { FHIRData, displayDate } from '../../data-services/models/fhirResources';
import { ObservationSummary } from '../../data-services/models/cqlSummary';
import { Summary, SummaryRowItem, SummaryRowItems } from './Summary';
import { BusySpinner } from '../busy-spinner/BusySpinner';

interface VitalsListProps {
  fhirDataCollection?: FHIRData[],
  vitalSignSummaryMatrix?: ObservationSummary[][],
}

interface VitalsListState {
}

export const VitalsList: React.FC<VitalsListProps> = (props: VitalsListProps) => {
  process.env.REACT_APP_DEBUG_LOG === "true" && console.log("VitalsList component RENDERED!")

  const vitSignSumMatrix: ObservationSummary[][] | undefined = props.vitalSignSummaryMatrix

  return (
    <div className="home-view">
      <div className="welcome">

        <h4 className="title">Vitals</h4>

        {props.fhirDataCollection === undefined
          && <> <p>Reading your clinical records...</p>
            <BusySpinner busy={props.fhirDataCollection === undefined} />
          </>
        }

        {
          vitSignSumMatrix?.map((vitalSignSummary, index) => {

            return (
              <div key={'outerArray-' + index}>
                
                {
                  vitalSignSummary && vitalSignSummary.length > 0 && vitalSignSummary[0]?.ConceptName === 'init'
                    ? <p>Loading...</p>
                    : (!vitalSignSummary || vitalSignSummary.length < 1) && props.fhirDataCollection !== undefined
                      ? <p>No records found.</p>
                      :
                      <div>
                        {vitalSignSummary?.map((obs, idx) => (
                          <Summary key={idx} id={idx} rows={buildRows(obs,props.fhirDataCollection![index].serverName)} />
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

const buildRows = (obs: ObservationSummary, theSource?:string): SummaryRowItems => {
  let rows: SummaryRowItems =
    [
      {
        isHeader: true,
        twoColumns: false,
        data1: obs.DisplayName,
        data2: '',
      },
      {
        isHeader: false,
        twoColumns: true,
        data1: obs.ResultText,
        data2: displayDate(obs.Date),
      },
      {
        isHeader: false,
        twoColumns: false,
        data1: "Performed by: " + (obs.Performer ?? 'Unknown'),
        data2: '',
      },
    ]


  if (theSource) {
    const rowItem: SummaryRowItem = {
      isHeader: false,
      twoColumns: false,
      data1: "From " + theSource,
      data2: '',
    };
    rows.push(rowItem);
  }
 
    
    

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
