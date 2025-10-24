import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

type AddRelationshipModalProps = {
  entities: Array<{ id: string; name: string }>;
  onClose: () => void;
  onAdd: (relationshipName: string, fromEntityId: string, toEntityId: string, fromCardinality: string, toCardinality: string) => void;
};

export function AddRelationshipModal({ entities, onClose, onAdd }: AddRelationshipModalProps) {
  const [relationshipName, setRelationshipName] = useState('');
  const [fromEntityId, setFromEntityId] = useState<string>('');
  const [toEntityId, setToEntityId] = useState<string>('');
  const [fromCardinality, setFromCardinality] = useState('1');
  const [toCardinality, setToCardinality] = useState('N');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!relationshipName.trim()) {
      alert('Please enter a relationship name');
      return;
    }

    if (!fromEntityId || !toEntityId) {
      alert('Please select both entities');
      return;
    }

    if (fromEntityId === toEntityId) {
      alert('Please select different entities for the relationship');
      return;
    }

    onAdd(relationshipName.trim(), fromEntityId, toEntityId, fromCardinality, toCardinality);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Relationship</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="relationshipName">
              Relationship Name
            </Label>
            <Input
              id="relationshipName"
              value={relationshipName}
              onChange={(e) => setRelationshipName(e.target.value)}
              placeholder="Enter relationship name"
              className="mt-1"
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="fromEntity">
              From Entity
            </Label>
            <Select
              value={fromEntityId}
              onValueChange={setFromEntityId}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select first entity" />
              </SelectTrigger>
              <SelectContent>
                {entities.map((entity) => (
                  <SelectItem key={entity.id} value={entity.id}>
                    {entity.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="fromCardinality">
              From Cardinality
            </Label>
            <Select
              value={fromCardinality}
              onValueChange={setFromCardinality}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 (One)</SelectItem>
                <SelectItem value="N">N (Many)</SelectItem>
                <SelectItem value="M">M (Many)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="toEntity">
              To Entity
            </Label>
            <Select
              value={toEntityId}
              onValueChange={setToEntityId}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select second entity" />
              </SelectTrigger>
              <SelectContent>
                {entities.map((entity) => (
                  <SelectItem 
                    key={entity.id} 
                    value={entity.id}
                    disabled={entity.id === fromEntityId}
                  >
                    {entity.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="toCardinality">
              To Cardinality
            </Label>
            <Select
              value={toCardinality}
              onValueChange={setToCardinality}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 (One)</SelectItem>
                <SelectItem value="N">N (Many)</SelectItem>
                <SelectItem value="M">M (Many)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
            >
              Add Relationship
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
