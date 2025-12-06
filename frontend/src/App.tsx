import { useState } from "react";
import { WalletProvider } from "./hooks/useWallet";
import { Navigation } from "./components/navigation";
import { HomePage } from "./pages/home-page";
import { DashboardPage } from "./pages/dashboard-page";
import { WinnersPage } from "./pages/winners-page";
import { DocsPage } from "./pages/docs-page";
import { TicketDetailPage } from "./pages/ticket-detail-page";
import { BuyTicketsPage } from "./pages/buy-tickets-page";
import { ContractInfoPage } from "./pages/contract-info-page";

export type PageType = 'home' | 'dashboard' | 'winners' | 'docs' | 'ticket-detail' | 'buy-tickets' | 'contract-info';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

  const navigateToTicket = (ticketId: number) => {
    setSelectedTicketId(ticketId);
    setCurrentPage('ticket-detail');
  };

  const navigateToPage = (page: PageType) => {
    setCurrentPage(page);
    if (page !== 'ticket-detail') {
      setSelectedTicketId(null);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onBuyTickets={() => navigateToPage('buy-tickets')} />;
      case 'dashboard':
        return <DashboardPage onViewTicket={navigateToTicket} onBuyTickets={() => navigateToPage('buy-tickets')} />;
      case 'winners':
        return <WinnersPage />;
      case 'docs':
        return <DocsPage />;
      case 'contract-info':
        return <ContractInfoPage />;
      case 'ticket-detail':
        return <TicketDetailPage ticketId={selectedTicketId} onBack={() => navigateToPage('dashboard')} />;
      case 'buy-tickets':
        return <BuyTicketsPage onSuccess={() => navigateToPage('dashboard')} />;
      default:
        return <HomePage onBuyTickets={() => navigateToPage('buy-tickets')} />;
    }
  };

  return (
    <WalletProvider>
      <div className="min-h-screen bg-black text-white">
        <Navigation currentPage={currentPage} onNavigate={navigateToPage} />
        {renderPage()}
      </div>
    </WalletProvider>
  );
}
