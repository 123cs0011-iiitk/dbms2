import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

type AddEntityModalProps = {
  entities: Array<{ id: string; name: string }>;
  onClose: () => void;
  onAdd: (entityName: string, connectToEntityId: string | null, relationshipName: string, fromCardinality: string, toCardinality: string) => void;
};

export function AddEntityModal({ entities, onClose, onAdd }: AddEntityModalProps) {
  const [entityName, setEntityName] = useState('');
  const [connectToEntityId, setConnectToEntityId] = useState<string | null>(null);
  const [relationshipName, setRelationshipName] = useState('');
  const [fromCardinality, setFromCardinality] = useState('1');
  const [toCardinality, setToCardinality] = useState('N');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!entityName.trim()) {
      alert('Please enter an entity name');
      return;
    }

    if (connectToEntityId && !relationshipName.trim()) {
      alert('Please enter a relationship name');
      return;
    }

    onAdd(entityName.trim(), connectToEntityId, relationshipName.trim(), fromCardinality, toCardinality);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Entity</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="entityName">
              Entity Name
            </Label>
            <Input
              id="entityName"
              value={entityName}
              onChange={(e) => setEntityName(e.target.value)}
              placeholder="Enter entity name"
              className="mt-1"
              autoFocus
            />
          </div>

          {entities.length > 0 && (
            <div>
              <Label htmlFor="connectTo">
                Connect to Entity (Optional)
              </Label>
              <Select
                value={connectToEntityId || 'none'}
                onValueChange={(value) => setConnectToEntityId(value === 'none' ? null : value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select an entity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Standalone)</SelectItem>
                  {entities.map((entity) => (
                    <SelectItem key={entity.id} value={entity.id}>
                      {entity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {connectToEntityId && (
            <>
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
                />
              </div>

              <div>
                <Label htmlFor="fromCardinality">
                  From Cardinality (Existing → New)
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
                <Label htmlFor="toCardinality">
                  To Cardinality (New → Existing)
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
            </>
          )}

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
              Add Entity
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
