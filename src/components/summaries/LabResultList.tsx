import '../../Home.css';
import React, { FC, useState, useEffect }  from 'react';
import { Link } from "react-router-dom";
import { FHIRData, displayDate } from '../../data-services/models/fhirResources';
import { ObservationSummary } from '../../data-services/models/cqlSummary';
import { Summary, SummaryRowItem, SummaryRowItems } from './Summary';
import { BusySpinner } from '../busy-spinner/BusySpinner';
import { SortModal } from '../sort-modal/sortModal';
import { SortOnlyModal } from '../sort-only-modal/sortOnlyModal';

interface LabResultListProps {
  fhirDataCollection?: FHIRData[],
  labResultSummaryMatrix?: ObservationSummary[][],
}

export const LabResultList: FC<LabResultListProps> = ({ fhirDataCollection, labResultSummaryMatrix }) => {
  process.env.REACT_APP_DEBUG_LOG === "true" && console.log("LabResultList component RENDERED!")
  const [showModal, setShowModal] = useState(false);
  const [sortingOption, setSortingOption] = useState<string>('');
  const [filteringOption, setFilteringOption] = useState<string[]>([]);
  const [sortedAndFilteredMatrix,setSortedAndFilteredMatrix] = useState<ObservationSummary[][] | undefined>();
  const [filteringOptions, setFilteringOptions] = useState<{value: string; label: string}[]>([]);
  
  useEffect(() => {
    applySortingAndFiltering();
  }, [labResultSummaryMatrix, sortingOption, filteringOption]);

  useEffect(() => {
    if (labResultSummaryMatrix) {
      generateFilteringOptions();
    }
  }, [labResultSummaryMatrix]);

  const closeModal = () => {
    setShowModal(false);
  };

  const handleSortFilterSubmit = (sortOption: string, filterOption?: string[]) => {
    setSortingOption(sortOption);
    if(filterOption){
      setFilteringOption(filterOption);
      }
    setShowModal(false);
  };

  const generateFilteringOptions = () => {
    if (!fhirDataCollection || fhirDataCollection.length === 0) {
      setFilteringOptions([]);
      return;
    }

    const uniqueServerNames = Array.from(new Set(fhirDataCollection.map(data => data.serverName)));
    const options = uniqueServerNames.map(value => ({
      value: value || '',
      label: value || '',
    }));

    setFilteringOptions(options);
  };

  const sortingOptions = [
    { value: 'alphabetical-az', label: 'Alphabetical: A-Z' },
    { value: 'alphabetical-za', label: 'Alphabetical: Z-A' },
    { value: 'newest', label: 'Date Created: Newest' },
    { value: 'oldest', label: 'Date Created: Oldest' },
  ];

  const applySortingAndFiltering = () => {
    if (!labResultSummaryMatrix) return;

    let filteredAndSortedMatrix = [...labResultSummaryMatrix];

    if (filteringOption.length > 0 && fhirDataCollection) {
      const filteredMatrix: ObservationSummary[][] = [];
    
      // Iterate over the goalSummaryMatrix length and push empty arrays to filteredMatrix
      for (let i = 0; i < labResultSummaryMatrix!.length; i++) {
        filteredMatrix.push([]);
      }
    
      filteringOption.forEach(option => {
        // Find the index of the selected option in the filteringOptions array
        const index = filteringOptions.findIndex(item => item.value === option);
        // If index is found, push the corresponding entry from goalSummaryMatrix to filteredMatrix
        if (index !== -1) {
          filteredMatrix[index] = filteredAndSortedMatrix[index];
        }
      });
    
      filteredAndSortedMatrix = filteredMatrix.filter(matrix => matrix !== undefined);
    }
    

    switch (sortingOption) {
      case 'alphabetical-az':
        filteredAndSortedMatrix = filteredAndSortedMatrix.map(providerGoals =>
          providerGoals.sort((a, b) => (a.DisplayName || '').localeCompare(b.DisplayName || ''))
        );
        break;
      case 'alphabetical-za':
        filteredAndSortedMatrix = filteredAndSortedMatrix.map(providerGoals =>
          providerGoals.sort((a, b) => (b.DisplayName || '').localeCompare(a.DisplayName || ''))
        );
        break;
      case 'newest':
        filteredAndSortedMatrix = filteredAndSortedMatrix.map(providerGoals =>
          providerGoals.sort((a, b) => (b.Date || '').localeCompare(a.Date || ''))
        );
        break;
      case 'oldest':
        filteredAndSortedMatrix = filteredAndSortedMatrix.map(providerGoals =>
          providerGoals.sort((a, b) => (a.Date || '').localeCompare(b.Date || ''))
        );
        break;
      default:
        break;
    }

    setSortedAndFilteredMatrix(filteredAndSortedMatrix);
  };

  return (
    <div className="home-view">
      <div className="welcome">

        <h4 className="title">Lab Results</h4>

        {fhirDataCollection === undefined
          && <> <p>Reading your clinical records...</p>
            <BusySpinner busy={fhirDataCollection === undefined} />
          </>
        }

{fhirDataCollection && fhirDataCollection.length === 1 ? ( // Checking for single provider
          <a className="text-right" onClick={() => setShowModal(true)}>
            SORT
          </a>
        ) : (
          <a className="text-right" onClick={() => setShowModal(true)}>
            SORT/FILTER
          </a>
        )}
          {showModal && ( // Conditional rendering of modal based on the number of providers
          fhirDataCollection && fhirDataCollection.length === 1 ? (
            <SortOnlyModal
              showModal={showModal}
              closeModal={closeModal}
              onSubmit={handleSortFilterSubmit}
              sortingOptions={sortingOptions}
            />
          ) : (
            <SortModal
              showModal={showModal}
              closeModal={closeModal}
              onSubmit={handleSortFilterSubmit}
              sortingOptions={sortingOptions}
              filteringOptions={filteringOptions}
            />
          )
        )}

        {
          sortedAndFilteredMatrix?.map((labResultSummary, index) => {

            return (
              <div key={'outerArray-' + index}>
             
                {
                  labResultSummary && labResultSummary.length > 0 && labResultSummary[0]?.ConceptName === 'init'
                    ? <p>Loading...</p>
                    : (!labResultSummary || labResultSummary.length < 1) && fhirDataCollection !== undefined
                      ? <p>No records found.</p>
                      :
                      <div>
                        {labResultSummary?.map((obs, idx) => (
                          <Summary key={idx} id={idx} rows={buildRows(obs,fhirDataCollection![index].serverName)} />
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

    if (theSource) {
      const source: SummaryRowItem = {
        isHeader: false,
        twoColumns: false,
        data1: 'From ' + theSource,
        data2: '',
      }
      rows.push(source)
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
