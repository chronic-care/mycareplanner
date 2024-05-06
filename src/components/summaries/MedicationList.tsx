import '../../Home.css';
import React, { FC, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FHIRData, displayDate } from '../../data-services/models/fhirResources';
import { MedicationSummary } from '../../data-services/models/cqlSummary';
import { Summary, SummaryRowItem, SummaryRowItems } from './Summary';
import { BusySpinner } from '../busy-spinner/BusySpinner';
import { SortModal } from '../sort-modal/sortModal';
import { SortOnlyModal } from '../sort-only-modal/sortOnlyModal';

interface MedicationListProps {
  fhirDataCollection?: FHIRData[],
  medicationSummaryMatrix?: MedicationSummary[][],
}

export const MedicationList: FC<MedicationListProps> = ({ fhirDataCollection, medicationSummaryMatrix }) => {
  process.env.REACT_APP_DEBUG_LOG === "true" && console.log("MedicationList component RENDERED!")
  const [showModal, setShowModal] = useState(false);
  const [sortingOption, setSortingOption] = useState<string>('');
  const [filteringOption, setFilteringOption] = useState<string[]>([]);
  const [sortedAndFilteredMatrix, setSortedAndFilteredMatrix] = useState<MedicationSummary[][] | undefined>();
  const [filteringOptions, setFilteringOptions] = useState<{ value: string; label: string }[]>([]);

 useEffect(() => {
  applySortingAndFiltering();
}, [medicationSummaryMatrix, sortingOption, filteringOption]);

useEffect(() => {
  if (medicationSummaryMatrix) {
    generateFilteringOptions();
  }
}, [medicationSummaryMatrix]);

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
  if (!medicationSummaryMatrix) return;

  let filteredAndSortedMatrix = [...medicationSummaryMatrix];

  if (filteringOption.length > 0 && fhirDataCollection) {
    const filteredMatrix: MedicationSummary[][] = [];
  
    // Iterate over the goalSummaryMatrix length and push empty arrays to filteredMatrix
    for (let i = 0; i < medicationSummaryMatrix!.length; i++) {
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
        providerGoals.sort((a, b) => (a.ConceptName || '').localeCompare(b.ConceptName || ''))
      );
      break;
    case 'alphabetical-za':
      filteredAndSortedMatrix = filteredAndSortedMatrix.map(providerGoals =>
        providerGoals.sort((a, b) => (b.ConceptName || '').localeCompare(a.ConceptName || ''))
      );
      break;
    case 'newest':
      filteredAndSortedMatrix = filteredAndSortedMatrix.map(providerGoals =>
        providerGoals.sort((a, b) => (b.AuthoredOn || '').localeCompare(a.AuthoredOn || ''))
      );
      break;
    case 'oldest':
      filteredAndSortedMatrix = filteredAndSortedMatrix.map(providerGoals =>
        providerGoals.sort((a, b) => (a.AuthoredOn || '').localeCompare(b.AuthoredOn || ''))
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

        <h4 className="title">Medications</h4>

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
          sortedAndFilteredMatrix?.map((medicationSummary, index) => {

            return (
              <div key={'outerArray-' + index}>
             
                {/* TODO:MULTI-PROVIDER: ConceptName === 'init' needs to refer to either medSumMatrix as a whole,
                 or, we need to initialize all possible rows (how do we know the # ahead of time?) to init vs just the first row.
                 Or, we need a better solution altogether. This applies to ALL summaries which use a summary matrix for display data
                 For now though, it's irrelevant as the data is all loaded ahead of time. If it's a massive data set, it may become relevant */}
                {
                  medicationSummary && medicationSummary.length > 0 && medicationSummary[0]?.ConceptName === 'init'
                    ? <p>Loading...</p>
                    : (!medicationSummary || medicationSummary.length < 1) && fhirDataCollection !== undefined
                      ? <p>No records found.</p>
                      :
                      <div>
                        {medicationSummary?.map((med, idx) => (
                          <Summary key={idx} id={idx} rows={buildRows(med,fhirDataCollection![index].serverName)} />
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

const buildRows = (med: MedicationSummary, theSource?:string): SummaryRowItems => {
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

  if (theSource) {
    const source: SummaryRowItem = {
      isHeader: false,
      twoColumns: false,
      data1: 'From ' + theSource,
      data2: '',
    }
    rows.push(source)
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
