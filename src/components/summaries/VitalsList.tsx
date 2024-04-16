import '../../Home.css';
import React,  { useState, useEffect } from 'react';
import { FHIRData, displayDate } from '../../data-services/models/fhirResources';
import { ObservationSummary } from '../../data-services/models/cqlSummary';
import { Summary, SummaryRowItem, SummaryRowItems } from './Summary';
import { BusySpinner } from '../busy-spinner/BusySpinner';
import { SortModal } from '../sort-modal/sortModal';

interface VitalsListProps {
  fhirDataCollection?: FHIRData[],
  vitalSignSummaryMatrix?: ObservationSummary[][],
}

interface VitalsListState {
}

export const VitalsList: React.FC<VitalsListProps> = (props: VitalsListProps) => {
  process.env.REACT_APP_DEBUG_LOG === "true" && console.log("VitalsList component RENDERED!")
  const [showModal, setShowModal] = useState(false);
  const [sortingOption, setSortingOption] = useState<string>('');
  const [filteringOption, setFilteringOption] = useState<string>('');
  const [sortedAndFilteredMatrix,setSortedAndFilteredMatrix] = useState<ObservationSummary[][] | undefined>();
  const [filteringOptions, setFilteringOptions] = useState<{value: string;label: string}[]>([]);
  
  const vitSignSumMatrix: ObservationSummary[][] | undefined = props.vitalSignSummaryMatrix

  useEffect(() => {
    applySortingAndFiltering();
  }, [props.vitalSignSummaryMatrix, sortingOption, filteringOption]);

  useEffect(() => {
    if (props.vitalSignSummaryMatrix) {
      generateFilteringOptions();
    }
  }, [props.vitalSignSummaryMatrix]);

  const closeModal = () => {
    setShowModal(false);
  };

  const handleSortFilterSubmit = (sortOption: string, filterOption: string) => {
    setSortingOption(sortOption);
    setFilteringOption(filterOption);
    setShowModal(false);
  };

  const generateFilteringOptions = () => {
    if (!props.vitalSignSummaryMatrix) return;

    const provenanceValues: string[] = [];

    props.vitalSignSummaryMatrix.forEach(providerObservations => {
      providerObservations.forEach(observation => {
        observation.Provenance?.forEach(provenance => {
          if (provenance.Transmitter) {
            provenanceValues.push(provenance.Transmitter);
          }
        });
      });
    });

    const uniqueProvenanceValues = Array.from(new Set(provenanceValues));

    const options = uniqueProvenanceValues.map(value => ({
      value: value,
      label: value
    }));

    setFilteringOptions(options);
  };

  const applySortingAndFiltering = () => {
    if (!props.vitalSignSummaryMatrix) return;

    let sortedMatrix = props.vitalSignSummaryMatrix;
    if (sortingOption === 'alphabetical-az') {
      sortedMatrix = props.vitalSignSummaryMatrix.map(providerObservations =>
        [...providerObservations].sort((a, b) =>
          (a.DisplayName ?? '').localeCompare(b.DisplayName ?? '')
        )
      );
    } else if (sortingOption === 'alphabetical-za') {
      sortedMatrix = props.vitalSignSummaryMatrix.map(providerObservations =>
        [...providerObservations].sort((a, b) =>
          (b.DisplayName ?? '').localeCompare(a.DisplayName ?? '')
        )
      );
    } else if (sortingOption === 'newest') {
      sortedMatrix = props.vitalSignSummaryMatrix.map(providerObservations =>
        [...providerObservations].sort((a, b) =>
          (b.Date ?? '').localeCompare(a.Date ?? '')
        )
      );
    } else if (sortingOption === 'oldest') {
      sortedMatrix = props.vitalSignSummaryMatrix.map(providerObservations =>
        [...providerObservations].sort((a, b) =>
          (a.Date ?? '').localeCompare(b.Date ?? '')
        )
      );
    }

    let filteredMatrix = sortedMatrix;
    if (filteringOption) {
      filteredMatrix = sortedMatrix.map(providerObservations =>
        providerObservations.filter(observation =>
          observation.Provenance?.some(
            provenance => provenance.Transmitter === filteringOption
          )
        )
      );
    }

    setSortedAndFilteredMatrix(filteredMatrix);
  };
  
  return (
    <div className="home-view">
      <div className="welcome">

        <h4 className="title">Vitals</h4>

        {props.fhirDataCollection === undefined
          && <> <p>Reading your clinical records...</p>
            <BusySpinner busy={props.fhirDataCollection === undefined} />
          </>
        }

        <a className="text-right" onClick={() => setShowModal(true)}>
          SORT/FILTER
        </a>
        {showModal ? (
          <SortModal
            showModal={showModal}
            closeModal={closeModal}
            onSubmit={handleSortFilterSubmit}
            sortingOptions={[
              { value: 'alphabetical-az', label: 'Alphabetical: A-Z' },
              { value: 'alphabetical-za', label: 'Alphabetical: Z-A' },
              { value: 'newest', label: 'Date: Newest' },
              { value: 'oldest', label: 'Date: Oldest' }
            ]}
            filteringOptions={filteringOptions}
          />
        ) : null}

        {
          sortedAndFilteredMatrix?.map((vitalSignSummary, index) => {

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
