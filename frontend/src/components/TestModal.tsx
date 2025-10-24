import { Beaker } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';

type TestModalProps = {
  onClose: () => void;
  onLoadSample: (sample: any) => void;
};

const sampleDiagrams = [
  {
    id: 'school',
    title: 'School Database',
    description: 'Students, Courses, Enrollments',
    entities: [
      {
        id: 'entity-student',
        name: 'Student',
        x: 150,
        y: 200,
        color: '#7aa2f7',
        attributes: [
          { id: 'student-attr-1', name: 'student_id', type: 'INTEGER', isPrimaryKey: true, isNullable: false },
          { id: 'student-attr-2', name: 'first_name', type: 'VARCHAR(50)', isNullable: false },
          { id: 'student-attr-3', name: 'last_name', type: 'VARCHAR(50)', isNullable: false },
          { id: 'student-attr-4', name: 'email', type: 'VARCHAR(100)', isNullable: false, isUnique: true },
        ],
      },
      {
        id: 'entity-course',
        name: 'Course',
        x: 600,
        y: 200,
        color: '#9ece6a',
        attributes: [
          { id: 'course-attr-1', name: 'course_id', type: 'INTEGER', isPrimaryKey: true, isNullable: false },
          { id: 'course-attr-2', name: 'course_name', type: 'VARCHAR(100)', isNullable: false },
          { id: 'course-attr-3', name: 'credits', type: 'INTEGER', isNullable: false },
        ],
      },
    ],
    relationships: [
      { 
        id: 'rel-1', 
        name: 'Enrolls', 
        x: 350, 
        y: 280,
        fromEntityId: 'entity-student', 
        toEntityId: 'entity-course', 
        cardinality: 'N:M',
        fromCardinality: 'N',
        toCardinality: 'M',
      },
    ],
  },
  {
    id: 'ecommerce',
    title: 'E-Commerce System',
    description: 'Customers, Products, Orders',
    entities: [
      {
        id: 'entity-customer',
        name: 'Customer',
        x: 150,
        y: 200,
        color: '#f7768e',
        attributes: [
          { id: 'customer-attr-1', name: 'customer_id', type: 'INTEGER', isPrimaryKey: true, isNullable: false },
          { id: 'customer-attr-2', name: 'name', type: 'VARCHAR(100)', isNullable: false },
          { id: 'customer-attr-3', name: 'email', type: 'VARCHAR(100)', isNullable: false, isUnique: true },
        ],
      },
      {
        id: 'entity-product',
        name: 'Product',
        x: 600,
        y: 200,
        color: '#7dcfff',
        attributes: [
          { id: 'product-attr-1', name: 'product_id', type: 'INTEGER', isPrimaryKey: true, isNullable: false },
          { id: 'product-attr-2', name: 'name', type: 'VARCHAR(100)', isNullable: false },
          { id: 'product-attr-3', name: 'price', type: 'DECIMAL(10,2)', isNullable: false },
        ],
      },
    ],
    relationships: [
      { 
        id: 'rel-1', 
        name: 'Purchases', 
        x: 350, 
        y: 280,
        fromEntityId: 'entity-customer', 
        toEntityId: 'entity-product', 
        cardinality: 'N:M',
        fromCardinality: 'N',
        toCardinality: 'M',
      },
    ],
  },
  {
    id: 'hospital',
    title: 'Hospital Management',
    description: 'Patients, Doctors, Appointments',
    entities: [
      {
        id: 'entity-patient',
        name: 'Patient',
        x: 150,
        y: 200,
        color: '#9ece6a',
        attributes: [
          { id: 'patient-attr-1', name: 'patient_id', type: 'INTEGER', isPrimaryKey: true, isNullable: false },
          { id: 'patient-attr-2', name: 'name', type: 'VARCHAR(100)', isNullable: false },
          { id: 'patient-attr-3', name: 'date_of_birth', type: 'DATE', isNullable: false },
        ],
      },
      {
        id: 'entity-doctor',
        name: 'Doctor',
        x: 600,
        y: 200,
        color: '#7aa2f7',
        attributes: [
          { id: 'doctor-attr-1', name: 'doctor_id', type: 'INTEGER', isPrimaryKey: true, isNullable: false },
          { id: 'doctor-attr-2', name: 'name', type: 'VARCHAR(100)', isNullable: false },
          { id: 'doctor-attr-3', name: 'specialization', type: 'VARCHAR(50)', isNullable: false },
        ],
      },
    ],
    relationships: [
      { 
        id: 'rel-1', 
        name: 'Treats', 
        x: 350, 
        y: 280,
        fromEntityId: 'entity-doctor', 
        toEntityId: 'entity-patient', 
        cardinality: '1:N',
        fromCardinality: '1',
        toCardinality: 'N',
      },
    ],
  },
];

export function TestModal({ onClose, onLoadSample }: TestModalProps) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Beaker className="w-5 h-5 text-[#db2777]" />
            Test with Sample ERD Diagrams
          </DialogTitle>
          <DialogDescription>
            Load pre-built ER diagrams to test the application quickly
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sampleDiagrams.map((sample) => (
              <div
                key={sample.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 dark:hover:border-blue-500 transition-colors bg-white dark:bg-[#1a1b26]"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold mb-1">{sample.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {sample.description}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-medium">{sample.entities.length}</span> entities
                    {' • '}
                    <span className="font-medium">{sample.relationships.length}</span> relationships
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {sample.entities.map((entity) => (
                      <span
                        key={entity.id}
                        className="text-xs px-2 py-1 rounded border"
                        style={{
                          borderColor: entity.color,
                          color: entity.color,
                        }}
                      >
                        {entity.name}
                      </span>
                    ))}
                  </div>
                </div>
                
                <Button
                  onClick={() => {
                    onLoadSample(sample);
                    onClose();
                  }}
                  className="w-full"
                  variant="outline"
                >
                  Load Diagram
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
