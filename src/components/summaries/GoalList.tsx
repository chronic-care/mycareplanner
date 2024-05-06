import '../../Home.css';
import React, { FC, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FHIRData } from '../../data-services/models/fhirResources';
import { GoalSummary, GoalTarget } from '../../data-services/models/cqlSummary';
import { Summary, SummaryRowItem, SummaryRowItems } from './Summary';
import { BusySpinner } from '../busy-spinner/BusySpinner';
import { SortModal } from '../sort-modal/sortModal';
import { SortOnlyModal } from '../sort-only-modal/sortOnlyModal';

interface GoalListProps {
  fhirDataCollection?: FHIRData[];
  goalSummaryMatrix?: GoalSummary[][];
  canShareData?: boolean;
}

export const GoalList: FC<GoalListProps> = ({ fhirDataCollection, goalSummaryMatrix, canShareData }) => {
  process.env.REACT_APP_DEBUG_LOG === "true" && console.log("GoalList component RENDERED!")
  const [showModal, setShowModal] = useState(false);
  const [sortingOption, setSortingOption] = useState<string>('');
  const [filteringOption, setFilteringOption] = useState<string[]>([]);
  const [sortedAndFilteredMatrix, setSortedAndFilteredMatrix] = useState<GoalSummary[][] | undefined>();
  const [filteringOptions, setFilteringOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    applySortingAndFiltering();
  }, [goalSummaryMatrix, sortingOption, filteringOption]);

  useEffect(() => {
    if (goalSummaryMatrix) {
      generateFilteringOptions();
    }
  }, [goalSummaryMatrix]);

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
    if (!goalSummaryMatrix) return;

    let filteredAndSortedMatrix = [...goalSummaryMatrix];

    if (filteringOption.length > 0 && fhirDataCollection) {
      const filteredMatrix: GoalSummary[][] = [];
    
      // Iterate over the goalSummaryMatrix length and push empty arrays to filteredMatrix
      for (let i = 0; i < goalSummaryMatrix!.length; i++) {
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
          providerGoals.sort((a, b) => (a.Description || '').localeCompare(b.Description || ''))
        );
        break;
      case 'alphabetical-za':
        filteredAndSortedMatrix = filteredAndSortedMatrix.map(providerGoals =>
          providerGoals.sort((a, b) => (b.Description || '').localeCompare(a.Description || ''))
        );
        break;
      case 'newest':
        filteredAndSortedMatrix = filteredAndSortedMatrix.map(providerGoals =>
          providerGoals.sort((a, b) => (b.StartDate || '').localeCompare(a.StartDate || ''))
        );
        break;
      case 'oldest':
        filteredAndSortedMatrix = filteredAndSortedMatrix.map(providerGoals =>
          providerGoals.sort((a, b) => (a.StartDate || '').localeCompare(b.StartDate || ''))
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
        <h4 className="title">Health Goals</h4>

        {fhirDataCollection === undefined && (
          <>
            <p>Reading your clinical records...</p>
            <BusySpinner busy={fhirDataCollection === undefined} />
          </>
        )}

        {canShareData && (
          <p>
            <Link to={{ pathname: '/goal-edit', state: { fhirDataCollection } }}>
              Add a New Goal
            </Link>
          </p>
        )}

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

        {sortedAndFilteredMatrix?.map((goalSummary, index) => (
          <div key={'outerArray-' + index}>
            {goalSummary && goalSummary.length > 0 && goalSummary[0]?.Description === 'init' ? (
              <p>Loading...</p>
            ) : !goalSummary || goalSummary.length < 1 ? (
              <p>No records found.</p>
            ) : (
              <div>
                {goalSummary?.map((goal, idx) => (
                  <Summary key={idx} id={idx} rows={buildRows(goal, fhirDataCollection![index].serverName)} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const buildRows = (goal: GoalSummary, theSource?: string): SummaryRowItems => {
  let rows: SummaryRowItems = [
    {
      isHeader: true,
      twoColumns: false,
      data1: goal.Description,
      data2: '',
    },
    {
      isHeader: false,
      twoColumns: true,
      data1: goal.ExpressedBy,
      data2: goal.StartDate === null ? '' : 'Start: ' + goal.StartDate,
    },
  ];

  const targets: SummaryRowItems = buildTargets(goal);
  if (targets?.length) {
    rows = rows.concat(targets);
  }

  const addresses: SummaryRowItems | undefined = goal.Addresses?.map(concern => ({
    isHeader: false,
    twoColumns: false,
    data1: 'Addresses: ' + (concern.DisplayName ?? 'Unknown'),
    data2: '',
  }));
  if (addresses?.length) {
    rows = rows.concat(addresses);
  }

  const learnMore: SummaryRowItem = {
    isHeader: false,
    twoColumns: false,
    data1:
      goal.LearnMore === undefined || goal.LearnMore === null ? '' : (
        <Link
          to="route"
          target="_blank"
          onClick={event => {
            event.preventDefault();
            window.open(goal.LearnMore);
          }}
        >
          <i>Learn More</i>
        </Link>
      ),
    data2: '',
  };
  rows.push(learnMore);

  const notes: SummaryRowItems | undefined = goal.Notes?.map(note => ({
    isHeader: false,
    twoColumns: false,
    data1: 'Note: ' + note,
    data2: '',
  }));
  if (notes?.length) {
    rows = rows.concat(notes);
  }

  if (theSource) {
    const source: SummaryRowItem = {
      isHeader: false,
      twoColumns: false,
      data1: 'From ' + theSource,
      data2: '',
    };
    rows.push(source);
  }

  const provenance: SummaryRowItems | undefined = goal.Provenance?.map(provenance => ({
    isHeader: false,
    twoColumns: true,
    data1: 'Source: ' + (provenance.Transmitter ?? ''),
    data2: provenance.Author ?? '',
  }));
  if (provenance?.length) {
    rows = rows.concat(provenance);
  }

  return rows;
};

const buildTargets = (goal: GoalSummary): SummaryRowItems => {
  let targets: SummaryRowItems = [];

  goal.Target?.forEach(curTarget => {
    let isPushLastResultTextAndDateOnly: boolean =
      (curTarget.DueDate === null || curTarget.DueDate === undefined) &&
      (curTarget.TargetValue === null || curTarget.TargetValue === undefined);

    let isPushTargetValueAndDueDateOnly: boolean = !curTarget.LastResult || !curTarget.LastResult.Date;

    let isPushBoth = !isPushLastResultTextAndDateOnly && !isPushTargetValueAndDueDateOnly;

    if (isPushLastResultTextAndDateOnly && !isPushTargetValueAndDueDateOnly) {
      targets.push(buildLastResultTextAndDate(curTarget));
    } else if (isPushTargetValueAndDueDateOnly && !isPushLastResultTextAndDateOnly) {
      targets.push(buildTargetValueAndDueDate(curTarget));
    } else if (isPushBoth) {
      targets.push(buildTargetValueAndDueDate(curTarget));
      targets.push(buildLastResultTextAndDate(curTarget));
    }
  });

  return targets;
};

const buildLastResultTextAndDate = (curTarget: GoalTarget): SummaryRowItem => {
  return {
    isHeader: false,
    twoColumns: false,
    data1: 'Last Value: ' + (curTarget.LastResult?.ResultText ?? '?') + ' on ' + (curTarget.LastResult?.Date || ''),
    data2: '',
  };
};

const buildTargetValueAndDueDate = (curTarget: GoalTarget): SummaryRowItem => {
  return {
    isHeader: false,
    twoColumns: true,
    data1: curTarget.TargetValue === null ? '' : 'Target: ' + curTarget.TargetValue,
    data2: curTarget.DueDate === null ? '' : 'Due: ' + curTarget.DueDate,
  };
};
