import { Component } from '@angular/core';
import { TaskDialogResult } from './task-dialog/task-dialog.component';
import { TaskDialogComponent } from './task-dialog/task-dialog.component';
import { Task } from './task/task';
import { MatDialog } from '@angular/material/dialog';
import { CdkDrag, CdkDragDrop, CdkDropList, transferArrayItem} from '@angular/cdk/drag-drop';
import { Observable } from 'rxjs';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { BehaviorSubject } from 'rxjs';


const getObservable = (collection: AngularFirestoreCollection<Task>) => {
  const subject = new BehaviorSubject<Task[]>([]);
  collection.valueChanges({ idField: 'id' }).subscribe((val: Task[]) => {
    subject.next(val);
  });
  return subject;
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],

})
export class AppComponent {

  // todo = this.store.collection('todo').valueChanges({ idField: 'id' }) as Observable<Task[]>;
  // inProgress =  this.store.collection('inProgress').valueChanges({ idField: 'id' }) as Observable<Task[]>;
  // done =  this.store.collection('done').valueChanges({ idField: 'id' }) as Observable<Task[]>;
  todo = getObservable(this.store.collection('todo')) as Observable<Task[]>;
  inProgress = getObservable(this.store.collection('inProgress')) as Observable<Task[]>;
  done = getObservable(this.store.collection('done')) as Observable<Task[]>;

constructor(private dialog : MatDialog, private store:AngularFirestore){
}

newTask() :void{
  console.log("Bouton de creation appelle.");
  
  const dialogRef = this.dialog.open(TaskDialogComponent, {
    width: '270px',
    data: {
      task: {},
    },
  });
  // On s'abonne a l'evenement de fermeture de 
  // la boite de dialogue, puis on ajout le resultat au tableau des taches a faires 
  dialogRef
    .afterClosed()
    .subscribe((result: TaskDialogResult|undefined) => {
      if (!result) {
        return;
      }
      console.log(result.task);
      
      this.store.collection('todo').add(result.task)
    });
}
editTask(list: 'done' | 'todo' | 'inProgress', task: Task): void {
  const dialogRef = this.dialog.open(TaskDialogComponent, {
    width: '270px',
    data: {
      task,
      enableDelete: true,
    },
  });
  dialogRef.afterClosed().subscribe((result: TaskDialogResult|undefined) => {
    if (!result) {
      return;
    }
    if (result.delete) {
      this.store.collection(list).doc(task.id).delete();
    } else {
      this.store.collection(list).doc(task.id).update(task);
    }
  });
}


drop(event: CdkDragDrop<Task[] | any>): void {
  if (event.previousContainer === event.container) {
    return;
  }
  const item = event.previousContainer.data[event.previousIndex];
  this.store.firestore.runTransaction(() => {
    const promise = Promise.all([
      this.store.collection(event.previousContainer.id).doc(item.id).delete(),
      this.store.collection(event.container.id).add(item),
    ]);
    return promise;
  });
  transferArrayItem(
    event.previousContainer.data,
    event.container.data,
    event.previousIndex,
    event.currentIndex
  );
}
}
