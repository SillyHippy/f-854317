
import React from 'react';
import { ServeAttemptData } from '@/components/ServeAttempt';
import { ClientData } from '@/components/ClientForm';
import ServeHistory from '@/components/ServeHistory';
import { usePagination } from '@/hooks/usePagination';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface PaginatedServeHistoryProps {
  serves: ServeAttemptData[];
  clients: ClientData[];
  onDelete?: (id: string) => void;
  onEdit?: (serve: ServeAttemptData) => void;
  itemsPerPage?: number;
}

const PaginatedServeHistory: React.FC<PaginatedServeHistoryProps> = ({
  serves,
  clients,
  onDelete,
  onEdit,
  itemsPerPage = 12
}) => {
  const {
    currentItems,
    currentPage,
    totalPages,
    setCurrentPage,
    hasNextPage,
    hasPrevPage,
  } = usePagination({ data: serves, itemsPerPage });

  if (serves.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">No serve history found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Showing {Math.min((currentPage - 1) * itemsPerPage + 1, serves.length)} - {Math.min(currentPage * itemsPerPage, serves.length)} of {serves.length} serves
        </p>
        <p className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </p>
      </div>

      <ServeHistory 
        serves={currentItems}
        clients={clients}
        onDelete={onDelete}
        onEdit={onEdit}
      />

      {totalPages > 1 && (
        <Pagination className="mt-8">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => hasPrevPage && setCurrentPage(currentPage - 1)}
                className={!hasPrevPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNumber;
              if (totalPages <= 5) {
                pageNumber = i + 1;
              } else if (currentPage <= 3) {
                pageNumber = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + i;
              } else {
                pageNumber = currentPage - 2 + i;
              }

              return (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    onClick={() => setCurrentPage(pageNumber)}
                    isActive={currentPage === pageNumber}
                    className="cursor-pointer"
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              );
            })}

            <PaginationItem>
              <PaginationNext 
                onClick={() => hasNextPage && setCurrentPage(currentPage + 1)}
                className={!hasNextPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default PaginatedServeHistory;
