'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  useDigitalFormQueriesApi, 
  useDigitalFormMutationsApi 
} from '@/hooks/digital-form';
import { ShiftType } from '@/common/types/digital-form';

// Ví dụ sử dụng các hooks Digital Form API
export default function DigitalFormApiExample() {
  const [selectedFormId, setSelectedFormId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  // Sử dụng hooks queries để lấy dữ liệu
  const { 
    getForm,
    listForms,
    getFormWithEntries,
    getFactoryReport
  } = useDigitalFormQueriesApi(handleError);

  // Sử dụng hooks mutations để thực hiện các thao tác cập nhật
  const {
    createFormMutation,
    updateFormMutation,
    submitFormMutation,
    updateFormEntryMutation
  } = useDigitalFormMutationsApi(handleError);
  
  // Lấy danh sách form với phân trang
  const { 
    data: formsData, 
    isLoading: isLoadingForms 
  } = listForms({
    limit: 10,
    page: 1,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  
  // Lấy chi tiết form khi có selectedFormId
  const { 
    data: formDetail, 
    isLoading: isLoadingDetail 
  } = getForm(selectedFormId, {
    enabled: !!selectedFormId
  });
  
  // Lấy form với entries
  const {
    data: formWithEntries,
    isLoading: isLoadingEntries
  } = getFormWithEntries(selectedFormId, {
    enabled: !!selectedFormId
  });
  
  // Lấy báo cáo factory
  const {
    data: factoryReport,
    isLoading: isLoadingReport
  } = getFactoryReport(
    'factory-1',  // factoryId
    '2023-01-01', // dateFrom
    '2023-01-31', // dateTo
    {
      includeLines: true,
      includeTeams: true,
      groupByBag: true,
      queryOptions: {
        enabled: false // Chỉ load khi cần thiết
      }
    }
  );

  // Xử lý lỗi chung cho tất cả các queries và mutations
  function handleError(error: any, operationName: string) {
    console.error(`Error in ${operationName}:`, error);
    setError(`Operation ${operationName} failed: ${error.message || 'Unknown error'}`);
    
    // Tự động ẩn lỗi sau 5 giây
    setTimeout(() => setError(null), 5000);
  }

  // Xử lý tạo form mới
  async function handleCreateForm() {
    try {
      const result = await createFormMutation.mutateAsync({
        userId: 'user-1',
        date: new Date().toISOString().split('T')[0],
        formName: `Daily Report ${new Date().toLocaleDateString()}`,
        shiftType: ShiftType.REGULAR
      });
      
      if (result.success) {
        setSelectedFormId(result.data.id);
        alert(`Form created with ID: ${result.data.id}`);
      }
    } catch (error) {
      console.error('Failed to create form:', error);
    }
  }
  
  // Xử lý cập nhật form
  async function handleUpdateForm() {
    if (!selectedFormId) {
      alert('Please select a form first');
      return;
    }
    
    try {
      const result = await updateFormMutation.mutateAsync({
        id: selectedFormId,
        data: {
          formName: `Updated: ${new Date().toLocaleTimeString()}`
        }
      });
      
      if (result.success) {
        alert('Form updated successfully!');
      }
    } catch (error) {
      console.error('Failed to update form:', error);
    }
  }
  
  // Xử lý submit form
  async function handleSubmitForm() {
    if (!selectedFormId) {
      alert('Please select a form first');
      return;
    }
    
    try {
      const result = await submitFormMutation.mutateAsync({
        formId: selectedFormId
      });
      
      if (result.success) {
        alert('Form submitted successfully!');
      }
    } catch (error) {
      console.error('Failed to submit form:', error);
    }
  }
  
  // Cập nhật entry trong form
  async function handleUpdateEntry(entryId: string) {
    if (!selectedFormId) {
      alert('Please select a form first');
      return;
    }
    
    try {
      // Cập nhật attendance status cho một entry
      const result = await updateFormEntryMutation.mutateAsync({
        formId: selectedFormId,
        entryId,
        data: {
          attendanceStatus: 'PRESENT',
          attendanceNote: 'Updated via API example'
        }
      });
      
      if (result.success) {
        alert(`Entry ${entryId} updated successfully!`);
      }
    } catch (error) {
      console.error('Failed to update entry:', error);
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Digital Form API Example</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Form Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleCreateForm} disabled={createFormMutation.isPending}>
              {createFormMutation.isPending ? 'Creating...' : 'Create New Form'}
            </Button>
            
            <Button onClick={handleUpdateForm} disabled={!selectedFormId || updateFormMutation.isPending}>
              {updateFormMutation.isPending ? 'Updating...' : 'Update Form Name'}
            </Button>
            
            <Button onClick={handleSubmitForm} disabled={!selectedFormId || submitFormMutation.isPending}>
              {submitFormMutation.isPending ? 'Submitting...' : 'Submit Form'}
            </Button>
            
            <div>
              <h3 className="font-semibold mb-2">Selected Form</h3>
              {isLoadingDetail ? (
                <p>Loading form details...</p>
              ) : formDetail ? (
                <div className="border rounded p-2">
                  <p><strong>ID:</strong> {formDetail.data.id}</p>
                  <p><strong>Name:</strong> {formDetail.data.formName}</p>
                  <p><strong>Status:</strong> {formDetail.data.status}</p>
                  <p><strong>Date:</strong> {formDetail.data.date}</p>
                </div>
              ) : selectedFormId ? (
                <p>No form data available</p>
              ) : (
                <p>Select a form from the list</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Forms List</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingForms ? (
              <p>Loading forms...</p>
            ) : formsData && formsData.data?.length > 0 ? (
              <div className="space-y-2">
                {formsData.data.map(form => (
                  <div 
                    key={form.id}
                    className={`border rounded p-2 cursor-pointer hover:bg-gray-50 ${
                      selectedFormId === form.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedFormId(form.id)}
                  >
                    <p><strong>{form.formName || 'Untitled Form'}</strong></p>
                    <p className="text-sm">Status: {form.status}</p>
                    <p className="text-sm">Date: {form.date}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No forms available</p>
            )}
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Form Entries</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingEntries ? (
              <p>Loading entries...</p>
            ) : formWithEntries && formWithEntries.data?.entries?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-left">Worker Name</th>
                      <th className="border p-2 text-left">Process</th>
                      <th className="border p-2 text-left">HandBag</th>
                      <th className="border p-2 text-left">Attendance</th>
                      <th className="border p-2 text-left">Total Output</th>
                      <th className="border p-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formWithEntries.data.entries.map(entry => (
                      <tr key={entry.id}>
                        <td className="border p-2">{entry.userName || 'Unknown'}</td>
                        <td className="border p-2">{entry.processName || 'N/A'}</td>
                        <td className="border p-2">{entry.handBagName || 'N/A'}</td>
                        <td className="border p-2">{entry.attendanceStatus}</td>
                        <td className="border p-2">{entry.totalOutput}</td>
                        <td className="border p-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateEntry(entry.id)}
                            disabled={updateFormEntryMutation.isPending}
                          >
                            Update
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : selectedFormId ? (
              <p>No entries available for this form</p>
            ) : (
              <p>Select a form to see its entries</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}