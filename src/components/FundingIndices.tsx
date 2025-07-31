import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FundingIndexService from '@/services/FundingIndexService';
import { FundingIndexData, Currency } from '@/types/finance';

const FundingIndices: React.FC = () => {
  const [fundingIndices, setFundingIndices] = React.useState<FundingIndexData[]>([]);
  const [groupedIndices, setGroupedIndices] = React.useState<Partial<Record<Currency, FundingIndexData[]>>>({});

  React.useEffect(() => {
    const fundingIndexService = FundingIndexService.getInstance();
    const indices = fundingIndexService.getAllFundingIndicesData();
    const grouped = fundingIndexService.getFundingIndicesByCurrency();
    
    setFundingIndices(indices);
    setGroupedIndices(grouped);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCurrencyFlag = (currency: Currency) => {
    const flags: Record<Currency, string> = {
      EUR: '🇪🇺', USD: '🇺🇸', GBP: '🇬🇧', CHF: '🇨🇭', JPY: '🇯🇵', CAD: '🇨🇦', AUD: '🇦🇺',
      CNY: '🇨🇳', MAD: '🇲🇦', INR: '🇮🇳', BRL: '🇧🇷', MXN: '🇲🇽', KRW: '🇰🇷', SGD: '🇸🇬',
      NOK: '🇳🇴', SEK: '🇸🇪', DKK: '🇩🇰', PLN: '🇵🇱', CZK: '🇨🇿', HUF: '🇭🇺', ZAR: '🇿🇦',
      PKR: '🇵🇰', THB: '🇹🇭', MYR: '🇲🇾'
    };
    return flags[currency] || '💱';
  };

  const getRecommendedIndicesForCurrency = (currency: Currency) => {
    const fundingIndexService = FundingIndexService.getInstance();
    return fundingIndexService.getAvailableFundingIndicesWithFallback(currency);
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            💱 Funding Indices Overview
            <Badge variant="outline" className="text-xs">
              {fundingIndices.length} indices across {Object.keys(groupedIndices).length} currencies
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(groupedIndices).map(([currency, indices]) => {
              const recommendedIndices = getRecommendedIndicesForCurrency(currency as Currency);
              const hasSpecificIndices = indices.some(index => recommendedIndices.includes(index.code));
              
              return (
                <div key={currency} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{getCurrencyFlag(currency as Currency)}</span>
                    <div>
                      <h3 className="font-semibold">{currency}</h3>
                      <p className="text-sm text-muted-foreground">
                        {indices.length} index{indices.length !== 1 ? 'es' : ''}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {indices.map(index => {
                      const isRecommended = recommendedIndices.includes(index.code);
                      const isDefault = recommendedIndices[0] === index.code;
                      
                      return (
                        <div key={index.code} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className={isRecommended ? 'font-medium' : 'text-muted-foreground'}>
                              {index.name}
                            </span>
                            {isRecommended && (
                              <Badge variant={isDefault ? 'default' : 'secondary'} className="text-xs">
                                {isDefault ? 'Default' : 'Recommended'}
                              </Badge>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {index.currentValue.toFixed(2)}%
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Funding Indices Table</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All Indices</TabsTrigger>
              <TabsTrigger value="recommended">Recommended Only</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Currency</TableHead>
                    <TableHead>Index Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-right">Current Rate</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fundingIndices.map((index) => {
                    const recommendedIndices = getRecommendedIndicesForCurrency(index.currency);
                    const isRecommended = recommendedIndices.includes(index.code);
                    const isDefault = recommendedIndices[0] === index.code;
                    
                    return (
                      <TableRow key={index.code} className={isRecommended ? 'bg-muted/50' : ''}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{getCurrencyFlag(index.currency)}</span>
                            <Badge variant="secondary">{index.currency}</Badge>
                            {isRecommended && (
                              <Badge variant={isDefault ? 'default' : 'secondary'} className="text-xs">
                                {isDefault ? 'Default' : 'Rec'}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{index.name}</TableCell>
                        <TableCell>
                          <code className="text-sm bg-muted px-2 py-1 rounded">{index.code}</code>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="default" className="text-sm">
                            {index.currentValue.toFixed(2)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(index.lastUpdated)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs">
                          {index.description}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TabsContent>
            
            <TabsContent value="recommended" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Currency</TableHead>
                    <TableHead>Index Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-right">Current Rate</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(groupedIndices).map(([currency, indices]) => {
                    const recommendedIndices = getRecommendedIndicesForCurrency(currency as Currency);
                    const defaultIndex = recommendedIndices[0];
                    const defaultIndexData = indices.find(index => index.code === defaultIndex);
                    
                    if (!defaultIndexData) return null;
                    
                    return (
                      <TableRow key={currency}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{getCurrencyFlag(currency as Currency)}</span>
                            <Badge variant="secondary">{currency}</Badge>
                            <Badge variant="default" className="text-xs">Default</Badge>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{defaultIndexData.name}</TableCell>
                        <TableCell>
                          <code className="text-sm bg-muted px-2 py-1 rounded">{defaultIndexData.code}</code>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="default" className="text-sm">
                            {defaultIndexData.currentValue.toFixed(2)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(defaultIndexData.lastUpdated)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs">
                          {defaultIndexData.description}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default FundingIndices; 