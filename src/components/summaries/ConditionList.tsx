import '../../Home.css';
import React, { FC, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useHistory } from 'react-router-dom';
import { FHIRData, displayDate } from '../../data-services/models/fhirResources';
import { ConditionSummary } from '../../data-services/models/cqlSummary';
import { Summary, SummaryRowItem, SummaryRowItems } from './Summary';
import { BusySpinner } from '../busy-spinner/BusySpinner';
import { SortModal } from '../sort-modal/sortModal';
import { SortOnlyModal } from '../sort-only-modal/sortOnlyModal';
import { Button } from '@mui/material';

interface ConditionListProps {
  fhirDataCollection?: FHIRData[];
  conditionSummaryMatrix?: ConditionSummary[][];
  canShareData?: boolean;
}

export const ConditionList: FC<ConditionListProps> = ({ fhirDataCollection, conditionSummaryMatrix, canShareData }) => {
  const history = useHistory();
  process.env.REACT_APP_DEBUG_LOG === "true" && console.log("ConditionList component RENDERED!")
  const [showModal, setShowModal] = useState(false);
  const [sortingOption, setSortingOption] = useState<string>('');
  const [filteringOption, setFilteringOption] = useState<string[]>([]);
  const [sortedAndFilteredConditions, setSortedAndFilteredConditions] = useState<{ condition: ConditionSummary, provider: string }[]>([]);
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
    if (filterOption) {
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
    if (!conditionSummaryMatrix || !fhirDataCollection) return;

    // Flatten the conditionSummaryMatrix to a single array with provider information
    let combinedConditions: { condition: ConditionSummary, provider: string }[] = [];
    conditionSummaryMatrix.forEach((providerConditions, providerIndex) => {
      const providerName = fhirDataCollection[providerIndex].serverName || 'Unknown';
      providerConditions.forEach(condition => {
        combinedConditions.push({ condition, provider: providerName });
      });
    });

    // Apply filtering
    if (filteringOption.length > 0) {
      combinedConditions = combinedConditions.filter(({ provider }) => filteringOption.includes(provider));
    }

    // Apply sorting
    switch (sortingOption) {
      case 'alphabetical-az':
        combinedConditions.sort((a, b) => (a.condition.CommonName  || '').localeCompare(b.condition.CommonName || ''));
        break;
      case 'alphabetical-za':
        combinedConditions.sort((a, b) => (b.condition.CommonName || '').localeCompare(a.condition.CommonName || ''));
        break;
      case 'newest':
        combinedConditions.sort((a, b) => (b.condition.RecordedDate || '').localeCompare(a.condition.RecordedDate || ''));
        break;
      case 'oldest':
        combinedConditions.sort((a, b) => (a.condition.RecordedDate || '').localeCompare(b.condition.RecordedDate || ''));
        break;
      default:
        break;
    }

    setSortedAndFilteredConditions(combinedConditions);
  };

  function handleEditClick(condition: ConditionSummary): void {
    history.push({
      pathname: '/condition-edit',
      state: {
        condition: condition
      }
    });
  }

  return (
    <div className="home-view">
      <div className="welcome">
        <h4 className="title">Current Health Issues</h4>

        {fhirDataCollection === undefined && (
          <>
            <p>Reading your clinical records...</p>
            <BusySpinner busy={fhirDataCollection === undefined} />
          </>
        )}

        {canShareData && (
          <p>
            <Button variant="contained" color="primary" onClick={() => handleEditClick({} as ConditionSummary)}>
              Add a Health Concern
            </Button>
          </p>
        )}

        {fhirDataCollection && fhirDataCollection.length === 1 ? (
          <a className="text-right" onClick={() => setShowModal(true)}>
            SORT
          </a>
        ) : (
          <a className="text-right" onClick={() => setShowModal(true)}>
            SORT/FILTER
          </a>
        )}

        {showModal && (
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

        {sortedAndFilteredConditions.length === 0 ? (
          <p>No records found.</p>
        ) : (
          sortedAndFilteredConditions.map(({ condition, provider }, index) => (
            <Summary key={index} id={index} rows={buildRows(condition, provider)} />
          ))
        )}
      </div>
    </div>
  );
};

const buildRows = (cond: ConditionSummary, theSource?: string): SummaryRowItems => {
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
