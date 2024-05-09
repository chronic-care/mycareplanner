import '../../Home.css';
import React, { FC, useEffect, useState }  from 'react';
import { Link } from 'react-router-dom';
import { FHIRData, displayDate } from '../../data-services/models/fhirResources';
import { ConditionSummary } from '../../data-services/models/cqlSummary';
import { Summary, SummaryRowItem, SummaryRowItems } from './Summary';
import { BusySpinner } from '../busy-spinner/BusySpinner';
import { SortModal } from '../sort-modal/sortModal';
import { SortOnlyModal } from '../sort-only-modal/sortOnlyModal';

interface ConditionListProps {
  fhirDataCollection?: FHIRData[],
  conditionSummaryMatrix?: ConditionSummary[][],
  canShareData?: boolean,
}

export const ConditionList: FC<ConditionListProps> = ({ fhirDataCollection, conditionSummaryMatrix, canShareData }) => {
  process.env.REACT_APP_DEBUG_LOG === "true" && console.log("ConditionList component RENDERED!")
  const [showModal, setShowModal] = useState(false);
  const [sortingOption, setSortingOption] = useState<string>('');
  const [filteringOption, setFilteringOption] = useState<string[]>([]);
  const [sortedAndFilteredMatrix, setSortedAndFilteredMatrix] = useState<ConditionSummary[][] | undefined>();
  const [filteringOptions, setFilteringOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    applySortingAndFiltering();
  }, [conditionSummaryMatrix, sortingOption, filteringOption]);

  useEffect(() => {
    if (conditionSummaryMatrix) {
      generateFilteringOptions();
    }
  }, [conditionSummaryMatrix]);

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
    if (!conditionSummaryMatrix) return;

    let filteredAndSortedMatrix = [...conditionSummaryMatrix];

    if (filteringOption.length > 0 && fhirDataCollection) {
      const filteredMatrix: ConditionSummary[][] = [];
    
      // Iterate over the goalSummaryMatrix length and push empty arrays to filteredMatrix
      for (let i = 0; i < conditionSummaryMatrix!.length; i++) {
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
          providerGoals.sort((a, b) => (b.OnsetDate || '').localeCompare(a.OnsetDate || ''))
        );
        break;
      case 'oldest':
        filteredAndSortedMatrix = filteredAndSortedMatrix.map(providerGoals =>
          providerGoals.sort((a, b) => (a.OnsetDate || '').localeCompare(b.OnsetDate || ''))
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

        <h4 className="title">Current Health Issues</h4>

        {fhirDataCollection === undefined
          && <> <p>Reading your clinical records...</p>
            <BusySpinner busy={fhirDataCollection === undefined} />
          </>
        }

        {canShareData
          ? <p><Link to={{ pathname: '/condition-edit', state: { fhirData: fhirDataCollection } }}>
            Add a Health Concern
            </Link>
            </p>
          : <p />}
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
          sortedAndFilteredMatrix?.map((conditionSummary, index) => {

            return (
              <div key={'outerArray-' + index}>
             
                {
                  conditionSummary && conditionSummary.length > 0 && conditionSummary[0]?.ConceptName === 'init'
                    ? <p>Loading...</p>
                    : (!conditionSummary || conditionSummary.length < 1) && fhirDataCollection !== undefined
                      ? <p>No records found.</p>
                      :
                      <div>
                        {conditionSummary?.map((cond, idx) => (
                          <Summary key={idx} id={idx} rows={buildRows(cond,fhirDataCollection![index].serverName)} />
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
